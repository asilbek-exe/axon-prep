import {
  Answer,
  Question,
  InterviewEvent,
  priorities,
  answerFields,
  Attempt,
  Story,
} from "./models";
export const wordCount = (s: string) =>
  s.trim() ? s.trim().split(/\s+/).length : 0;
export const answerText = (a?: Answer) =>
  a
    ? a.polished ||
      a.draft ||
      a.sixty ||
      a.thirty ||
      a.quick ||
      a.bulletNotes ||
      [
        a.starSituation,
        a.starTask,
        a.starAction,
        a.starResult,
        a.starReflection,
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";
export const hasAnswer = (a?: Answer) =>
  !!a && answerFields.some((f) => a[f].trim());
export const priorityOrder = (a: Question, b: Question) =>
  priorities.indexOf(a.priority) - priorities.indexOf(b.priority);
// Confidence maps to 4 hours, 1 day, 3 days, 7 days, 14 days. Repeated weak ratings keep the shorter interval.
export function nextReview(confidence: number, now = new Date()) {
  return new Date(
    now.getTime() + [0, 4 / 24, 1, 3, 7, 14][confidence] * 86400000,
  ).toISOString();
}
// Convert a wall-clock time in New York to an instant, including DST. Two passes correct the offset.
export function interviewTime(event: Pick<InterviewEvent, "date" | "time">) {
  const desired = Date.parse(`${event.date}T${event.time}:00Z`);
  let result = desired;
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(result));
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
    const local = Date.parse(
      `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`,
    );
    result += desired - local;
  }
  return result;
}
export function eventState(e: InterviewEvent, now = Date.now()) {
  if (e.completed) return "Completed";
  const start = interviewTime(e);
  if (now >= start + e.duration * 60000) return "Past · add reflection";
  if (now >= start) return "Scheduled time · in progress";
  const minutes = Math.ceil((start - now) / 60000);
  const d = Math.floor(minutes / 1440),
    h = Math.floor((minutes % 1440) / 60),
    m = minutes % 60;
  return `${d ? `${d}d ` : ""}${h}h ${m}m to go`;
}
export function metrics(
  questions: Question[],
  answers: Answer[],
  attempts: Attempt[],
  topIds: string[],
) {
  const filled = answers.filter((a) => hasAnswer(a) && !a.starter);
  const top = questions.filter((q) => topIds.includes(q.id));
  const points = top.reduce(
    (n, q) =>
      n +
      (filled.some((a) => a.questionId === q.id) ? 0.4 : 0) +
      (q.status === "Ready to Practice" ||
      q.status === "Confident" ||
      q.status === "Mastered"
        ? 0.3
        : 0) +
      (attempts.some((a) => a.questionId === q.id) ? 0.3 : 0),
    0,
  );
  return {
    answered: filled.length,
    mastered: questions.filter((q) => q.status === "Mastered").length,
    review: questions.filter(
      (q) =>
        q.reviewFlag ||
        q.status === "Needs Improvement" ||
        (q.nextReview && Date.parse(q.nextReview) <= Date.now()),
    ).length,
    completion: questions.length
      ? Math.round((100 * filled.length) / questions.length)
      : 0,
    readiness: top.length ? Math.round((100 * points) / top.length) : 0,
  };
}
export function recommendations(
  questions: Question[],
  answers: Answer[],
  attempts: Attempt[],
  stories: Story[],
  event?: InterviewEvent,
) {
  const items: { title: string; reason: string; href: string }[] = [];
  if (
    event &&
    (event.completed ||
      Date.now() > interviewTime(event) + event.duration * 60000)
  )
    items.push({
      title: "Begin Engineering with AI preparation",
      reason:
        "Your recruiter screen is past its scheduled time. Record the outcome and prepare for the next round.",
      href: "/technical",
    });
  for (const id of ["why-axon", "intro", "shakeur", "authorization"]) {
    const q = questions.find((q) => q.id === id);
    if (!q) continue;
    const a = answers.find((a) => a.questionId === id);
    if (!hasAnswer(a) || a?.starter)
      items.push({
        title: `Make it yours: ${q.text}`,
        reason: a?.starter
          ? "A starter draft is waiting for your own wording."
          : "This important answer is still blank.",
        href: `/questions/${id}`,
      });
    else if (!attempts.some((a) => a.questionId === id))
      items.push({
        title: `Practice: ${q.text}`,
        reason:
          "You have written this answer, but have not saved a practice attempt.",
        href: `/practice?question=${id}`,
      });
  }
  if (
    wordCount(answerText(answers.find((a) => a.questionId === "intro"))) > 250
  )
    items.unshift({
      title: "Shorten your introduction",
      reason:
        "It is over 250 words. Aim for a brief introduction for this 15-minute call.",
      href: "/questions/intro",
    });
  if (
    !stories.some(
      (s) =>
        !s.archived &&
        s.valueIds.includes("Expect Candor") &&
        s.result &&
        s.reflection,
    )
  )
    items.push({
      title: "Find a real example of candor",
      reason: "No completed story currently covers Expect Candor.",
      href: "/stories",
    });
  const weak = questions.find((q) => q.confidence > 0 && q.confidence < 3);
  if (weak)
    items.push({
      title: `Review: ${weak.text}`,
      reason: "Your latest confidence rating was below 3.",
      href: "/review",
    });
  return items.slice(0, 5);
}
export const formatDate = (s: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(s.length === 10 ? s + "T12:00:00Z" : s));
export function coach(text: string, stage: string, rate: number) {
  const count = wordCount(text);
  const tips = [];
  if (!count)
    return ["Start with the point you want the interviewer to remember."];
  if (stage === "Recruiter" && count > 150)
    tips.push(
      "This may run long for a recruiter screen. Keep one example and move details into notes.",
    );
  if (
    /\b(leverag\w*|synerg\w*|cutting-edge|unwavering|deeply passionate)\b/i.test(
      text,
    )
  )
    tips.push("Try simpler wording that feels natural when spoken.");
  if (!/\b(I|my)\b/i.test(text)) tips.push("Make your own contribution clear.");
  tips.push(
    `Estimated speaking time: ${Math.ceil((count / rate) * 60)} seconds at ${rate} words/minute.`,
  );
  return tips;
}
