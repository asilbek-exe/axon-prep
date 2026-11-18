"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  ArrowUpRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { useData, useToast, flushAll } from "@/lib/store";
import { eventState, formatDate, hasAnswer, interviewTime } from "@/lib/logic";
import { Checklist } from "./ui";
import { askNicholas } from "@/data/seed";
import { SavedNote } from "@/lib/store";

const steps = [
  {
    id: "intro",
    title: "Prepare your introduction",
    time: 5,
    description: "A 45-second answer to “Tell me about yourself.”",
  },
  {
    id: "why",
    title: "Know why you want to join Axon",
    time: 5,
    description:
      "Connect the work, your experience, and the AfroTech conversation.",
  },
  {
    id: "stories",
    title: "Have two stories ready",
    time: 8,
    description: "Use LASSO for ownership and ShakeUR for engineering.",
  },
  {
    id: "logistics",
    title: "Get the practical details straight",
    time: 4,
    description: "Availability, location preferences, and work authorization.",
  },
  {
    id: "questions",
    title: "Choose two questions for Nicholas",
    time: 3,
    description: "Focus on team matching and what comes next.",
  },
  {
    id: "rehearse",
    title: "Do one practice run",
    time: 15,
    description: "Say your answers aloud, then check the call setup.",
  },
];

export function PreparationGuide() {
  const { notes, answers, events } = useData();
  const toast = useToast();
  const done = steps
    .filter((s) =>
      notes.some((n) => n.id === `prep-step-${s.id}` && n.value === "true"),
    )
    .map((s) => s.id);
  const [open, setOpen] = useState<string | null>(
    () => steps.find((s) => !done.includes(s.id))?.id || null,
  );
  const [saving, setSaving] = useState(false);
  const [now] = useState(Date.now);
  const event = events.find((e) => e.id === "recruiter");
  const past =
    event &&
    (event.completed || now > interviewTime(event) + event.duration * 60000);
  const remaining = steps
    .filter((s) => !done.includes(s.id))
    .reduce((total, s) => total + s.time, 0);
  const hasPersonalAnswer = (id: string) =>
    answers.some((a) => a.questionId === id && !a.starter && hasAnswer(a));

  async function complete(id: string, completed: boolean) {
    if (saving) return;
    setSaving(true);
    try {
      await flushAll();
      await db.notes.put({
        id: `prep-step-${id}`,
        value: String(completed),
        updatedAt: new Date().toISOString(),
      });
      if (completed) {
        const index = steps.findIndex((s) => s.id === id);
        const next =
          steps.slice(index + 1).find((s) => !done.includes(s.id)) ||
          steps.find((s) => s.id !== id && !done.includes(s.id));
        setOpen(next?.id || null);
      }
    } catch {
      toast("Could not save your progress. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="prep-guide">
      <header className="guide-heading">
        <div className="guide-kicker">AXON / RECRUITER CONVERSATION</div>
        <h1>
          Your 15-minute interview,
          <br />
          <span>one step at a time.</span>
        </h1>
        <p>
          You already have the experience. Spend about 40 minutes
          <br className="desktop-break" /> getting comfortable explaining it.
        </p>
      </header>
      {past && (
        <div className="guide-past">
          <span>
            {eventState(event, now)}. Keep these notes for reference or update
            the interview date.
          </span>
          <Link href="/journey">
            Add a reflection <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
      <div className="guide-layout">
        <section
          className="guide-plan"
          aria-label="Interview preparation steps"
        >
          <div className="guide-progress">
            <span>{done.length} of 6 steps complete</span>
            <span>
              {remaining
                ? `About ${remaining} min left`
                : "You’ve worked through the plan"}
            </span>
          </div>
          <div className="guide-progress-track">
            <div style={{ width: `${(done.length / steps.length) * 100}%` }} />
          </div>
          {steps.map((step, index) => {
            const active = open === step.id;
            const completed = done.includes(step.id);
            const written =
              step.id === "intro"
                ? hasPersonalAnswer("intro")
                : step.id === "why"
                  ? hasPersonalAnswer("why-axon")
                  : false;
            return (
              <article
                className={`guide-step ${active ? "expanded" : ""} ${completed ? "complete" : ""}`}
                key={step.id}
              >
                <h2>
                  <button
                    className="guide-step-toggle"
                    aria-expanded={active}
                    aria-controls={`step-content-${step.id}`}
                    onClick={() => setOpen(active ? null : step.id)}
                  >
                    <span className="guide-step-number">
                      {completed ? (
                        <Check size={16} />
                      ) : (
                        String(index + 1).padStart(2, "0")
                      )}
                    </span>
                    <span className="guide-step-label">
                      <strong>{step.title}</strong>
                      <span>
                        {completed
                          ? "Complete · "
                          : written
                            ? "Answer saved · "
                            : ""}
                        {step.time} min{!active && ` · ${step.description}`}
                      </span>
                    </span>
                    <ChevronDown size={16} />
                  </button>
                </h2>
                {active && (
                  <div
                    className="guide-step-content"
                    id={`step-content-${step.id}`}
                  >
                    <StepContent id={step.id} />
                    <div className="guide-step-bottom">
                      <button
                        className={completed ? "guide-undo" : "primary"}
                        disabled={saving}
                        onClick={() => void complete(step.id, !completed)}
                      >
                        {completed
                          ? "Mark as unfinished"
                          : index === steps.length - 1
                            ? "Finish preparation"
                            : "Done, next step"}
                        {!completed && <ArrowRight size={15} />}
                      </button>
                      <span>
                        {completed
                          ? "You can revisit this anytime."
                          : "Mark complete when you feel ready."}
                      </span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          {done.length === steps.length && (
            <div className="guide-finished">
              <Check size={21} />
              <h2>You’ve done the preparation.</h2>
              <p>
                Keep your notes close. Listen first, answer simply, and let the
                conversation happen.
              </p>
              <Link href="/call-mode" className="button primary">
                Open call notes <ArrowRight size={15} />
              </Link>
            </div>
          )}
          <Link href="/recruiter-reference" className="guide-library-link">
            Need more detail? Open the full recruiter reference{" "}
            <ArrowUpRight size={14} />
          </Link>
        </section>
        <aside className="guide-aside">
          <section className="guide-interview">
            <span className="guide-aside-label">YOUR INTERVIEW</span>
            <h2>Nicholas Cortez</h2>
            <p>Recruiter II · Axon</p>
            <div className="guide-appointment">
              <strong>
                {event ? formatDate(event.date) : "Set the date in Journey"}
              </strong>
              <span>
                {event
                  ? new Intl.DateTimeFormat("en-US", {
                      timeZone: "America/New_York",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZoneName: "short",
                    }).format(interviewTime(event))
                  : "Time to confirm"}{" "}
                · {event?.duration || 15} min
              </span>
              <span>Virtual · SWE Internship 2027</span>
            </div>
            <Link href="/journey">
              Interview details <ArrowUpRight size={13} />
            </Link>
          </section>
          <section className="guide-call-flow">
            <span className="guide-aside-label">HOW THE 15 MINUTES MAY GO</span>
            <ol>
              <li>
                <span>0–2 min</span>
                <div>Hello & introductions</div>
              </li>
              <li>
                <span>2–9 min</span>
                <div>Your background & interest</div>
              </li>
              <li>
                <span>9–12 min</span>
                <div>Availability & logistics</div>
              </li>
              <li>
                <span>12–15 min</span>
                <div>Your questions & next steps</div>
              </li>
            </ol>
            <p>
              A suggested flow, not a confirmed agenda. Follow Nicholas’s lead.
            </p>
          </section>
          <section className="guide-reminder">
            <Clock3 size={17} />
            <p>
              <strong>Keep answers to 30–60 seconds.</strong>
              <br />
              Lead with your point. Share one example. Leave room for a
              follow-up.
            </p>
          </section>
          <Link className="guide-call-link" href="/call-mode">
            Open call notes <ArrowRight size={15} />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function StepContent({ id }: { id: string }) {
  if (id === "intro")
    return (
      <>
        <p className="guide-instruction">
          Build a short introduction in three parts. Aim for 45 seconds, then
          stop and let Nicholas follow up.
        </p>
        <ol className="guide-points">
          <li>
            <strong>Where you are now.</strong> CS + Business at Rochester,
            graduating May 2028.
          </li>
          <li>
            <strong>What you build.</strong> You lead five student engineers
            working on LASSO, a production platform with 1,000+ users.
          </li>
          <li>
            <strong>What you want next.</strong> Backend work, connected
            devices, or security. Mention ShakeUR or your AI research in one
            sentence.
          </li>
        </ol>
        <Link href="/questions/intro" className="guide-work-link">
          Write my introduction <ArrowUpRight size={15} />
        </Link>
        <p className="guide-small-tip">
          Use a few bullet points. You don’t need to memorize a script.
        </p>
      </>
    );
  if (id === "why")
    return (
      <>
        <p className="guide-instruction">
          Prepare a 30–45 second answer that connects a specific part of Axon’s
          work to something you’ve done.
        </p>
        <ol className="guide-points">
          <li>
            <strong>The work.</strong> Software connected to real devices, where
            reliability matters.
          </li>
          <li>
            <strong>Your connection.</strong> ShakeUR brought Raspberry Pi,
            computer vision, and FastAPI together.
          </li>
          <li>
            <strong>Your conversation.</strong> Nache told you how closely
            software and hardware teams collaborate at Axon.
          </li>
        </ol>
        <p className="guide-small-tip">
          Mention what you learned at AfroTech naturally. A personal
          recommendation has not been confirmed.
        </p>
        <div className="guide-links">
          <Link href="/questions/why-axon" className="guide-work-link">
            Prepare “Why Axon?” <ArrowUpRight size={15} />
          </Link>
          <Link href="/company">Refresh my company knowledge</Link>
        </div>
      </>
    );
  if (id === "stories")
    return (
      <>
        <p className="guide-instruction">
          Have two one-minute examples ready. For each: the problem, your
          contribution, and the result. Keep technical details for follow-up
          questions.
        </p>
        <div className="guide-story">
          <span>01</span>
          <div>
            <h3>LASSO → ownership</h3>
            <p>
              Leading five engineers and supporting production software. Choose
              a real scheduling, authentication, or deployment decision you
              owned.
            </p>
            <Link href="/questions/lasso">
              Prepare my LASSO story <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <div className="guide-story">
          <span>02</span>
          <div>
            <h3>ShakeUR → engineering</h3>
            <p>
              A Raspberry Pi alarm clock dismissed through movement. Explain
              your backend architecture and FastAPI integration, then one
              challenge you solved.
            </p>
            <Link href="/questions/shakeur">
              Prepare my ShakeUR story <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <p className="guide-small-tip">
          If research comes up, keep the detection result scoped to your
          manually constructed test set.
        </p>
      </>
    );
  if (id === "logistics")
    return (
      <>
        <p className="guide-instruction">
          Write down the facts you can confidently confirm. Keep these answers
          brief and direct.
        </p>
        <ul className="guide-points">
          <li>Your available start and end dates for summer 2027.</li>
          <li>Your actual location preferences and willingness to relocate.</li>
          <li>
            Your work-authorization and sponsorship details, after confirming
            them with your university’s international student office.
          </li>
        </ul>
        <p className="guide-small-tip">
          You supplied that you are an F-1 student. If something is not yet
          confirmed, say so rather than guessing.
        </p>
        <div className="guide-links">
          <Link href="/questions/locations" className="guide-work-link">
            Prepare availability & locations <ArrowUpRight size={15} />
          </Link>
          <Link href="/questions/authorization">
            Prepare work-authorization wording
          </Link>
        </div>
      </>
    );
  if (id === "questions") return <RecruiterQuestionPicker />;
  return (
    <>
      <p className="guide-instruction">
        Do one 15-minute mock aloud. Practice your introduction, why Axon, one
        project story, and your questions. Afterward, choose just one thing to
        improve.
      </p>
      <Link href="/practice?mode=full" className="guide-work-link">
        Start a 15-minute mock <ArrowUpRight size={15} />
      </Link>
      <div className="guide-final-check">
        <h3>Before you join</h3>
        <Checklist
          prefix="guide-dayof"
          items={[
            "Confirm the interview link and Eastern time",
            "Test your microphone and camera",
            "Have your resume and two questions open",
            "Join a few minutes early",
          ]}
        />
      </div>
      <p className="guide-small-tip">
        During the call: listen, pause, answer the question asked. Close by
        thanking Nicholas and confirming the next step.
      </p>
    </>
  );
}

function RecruiterQuestionPicker() {
  const { notes } = useData();
  const toast = useToast();
  const picked = notes.filter(
    (n) => n.id.startsWith("pick-") && n.value === "true",
  );
  const [more, setMore] = useState(false);
  const indexes = more
    ? [2, 6, 0, 1, 3, 4, 5]
    : [
        2,
        6,
        ...picked
          .map((n) => Number(n.id.replace("pick-", "")))
          .filter((i) => i !== 2 && i !== 6),
      ];
  return (
    <>
      <p className="guide-instruction">
        Choose two questions to keep beside you. These two are a useful starting
        point; you can edit them in your own words.
      </p>
      <div className="guide-question-picks">
        {indexes.map((i) => (
          <div className="guide-question-pick" key={i}>
            <label>
              <input
                type="checkbox"
                aria-label={`Select recruiter question ${i + 1}`}
                checked={picked.some((n) => n.id === `pick-${i}`)}
                onChange={async (e) => {
                  if (e.target.checked && picked.length >= 3) {
                    toast(
                      "Keep two or three questions; deselect one before adding another.",
                    );
                    return;
                  }
                  try {
                    await db.notes.put({
                      id: `pick-${i}`,
                      value: String(e.target.checked),
                      updatedAt: new Date().toISOString(),
                    });
                  } catch {
                    toast("Could not save your selection.");
                  }
                }}
              />
              <span>
                {notes.find((n) => n.id === `ask-${i}`)?.value ||
                  askNicholas[i]}
              </span>
            </label>
            <details>
              <summary>Edit wording</summary>
              <SavedNote
                id={`ask-${i}`}
                label={`Edit question ${i + 1}`}
                rows={2}
              />
            </details>
          </div>
        ))}
      </div>
      <div className="guide-links">
        <button className="text-button" onClick={() => setMore(!more)}>
          {more ? "Show fewer suggestions" : "See more suggested questions"}
        </button>
        <span className="muted">
          {picked.length} selected · saved in call notes
        </span>
      </div>
    </>
  );
}
