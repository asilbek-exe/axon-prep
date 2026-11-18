"use client";
import { questionHref } from "@/lib/paths";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Eye,
  Mic,
  Check,
  Clock3,
} from "lucide-react";
import { useData, useAutosave, useToast, flushAll } from "@/lib/store";
import { db, rateQuestion } from "@/lib/db";
import { Attempt, ratingKeys } from "@/lib/models";
import { topIds } from "@/data/seed";
import { answerText, formatDate } from "@/lib/logic";
import { PageHeader, Card, Badge, Confidence, Empty, ActionLink } from "./ui";
const modes = [
  {
    id: "quick",
    name: "Quick recruiter practice",
    description:
      "Five focused questions. Get comfortable saying the essentials.",
    minutes: 8,
    tag: "5 QUESTIONS",
  },
  {
    id: "full",
    name: "Full recruiter simulation",
    description:
      "A realistic 15-minute run, from your introduction to your questions.",
    minutes: 15,
    tag: "15 MINUTES",
  },
  {
    id: "behavioral",
    name: "Behavioral practice",
    description:
      "Tell real stories with a clear situation, action, and result.",
    minutes: 15,
    tag: "STAR STORIES",
  },
  {
    id: "values",
    name: "Values practice",
    description: "Connect what you have done to the values you share.",
    minutes: 12,
    tag: "SEVEN VALUES",
  },
  {
    id: "technical",
    name: "Technical communication",
    description:
      "Explain a system, a tradeoff, or how you would test a solution.",
    minutes: 15,
    tag: "THINK OUT LOUD",
  },
  {
    id: "custom",
    name: "Build your own session",
    description: "Select exactly the questions you want to work through.",
    minutes: 15,
    tag: "YOUR CHOICE",
  },
];
type Run = {
  sessionId: string;
  mode: string;
  ids: string[];
  index: number;
  elapsed: number;
  questionStart: number;
  runningSince: number | null;
  answer: string;
  ratings: Attempt["ratings"];
  notes: string;
  limit: number;
};
const initialRatings = () => ({
  clarity: 3,
  relevance: 3,
  confidence: 3,
  conciseness: 3,
  structure: 3,
  evidence: 3,
});
const elapsedOf = (r: Run, now: number) =>
  r.elapsed +
  (r.runningSince === null ? 0 : Math.max(0, now - r.runningSince) / 1000);
const clock = (n: number) =>
  `${String(Math.floor(Math.max(0, n) / 60)).padStart(2, "0")}:${String(Math.floor(Math.max(0, n) % 60)).padStart(2, "0")}`;
function readRun(value?: string): Run | null {
  try {
    const r = JSON.parse(value || "null");
    return r &&
      typeof r.sessionId === "string" &&
      Array.isArray(r.ids) &&
      r.ids.length &&
      Number.isInteger(r.index) &&
      r.index >= 0 &&
      r.index < r.ids.length &&
      r.ratings &&
      typeof r.elapsed === "number" &&
      typeof r.questionStart === "number" &&
      (r.runningSince === null || typeof r.runningSince === "number") &&
      typeof r.answer === "string" &&
      typeof r.notes === "string" &&
      typeof r.limit === "number"
      ? r
      : null;
  } catch {
    return null;
  }
}
export function Practice() {
  const { questions, notes, sessions, attempts } = useData();
  const params = useSearchParams();
  const toast = useToast();
  const [run, setRun] = useState<Run | null>(() =>
    readRun(notes.find((n) => n.id === "active-practice")?.value),
  );
  const [tab, setTab] = useState(
    params.get("history") ? "History" : "Practice modes",
  );
  const [mode, setMode] = useState(params.get("mode") || "quick");
  const [selected, setSelected] = useState<string[]>(
    params.get("question") ? [params.get("question")!] : [],
  );
  const [search, setSearch] = useState("");
  const [done, setDone] = useState("");
  const [starting, setStarting] = useState(false);
  async function start() {
    if (starting) return;
    setStarting(true);
    try {
      let ids: string[];
      if (params.get("question") && mode === "quick")
        ids = selected.filter((id) => questions.some((q) => q.id === id));
      else if (mode === "custom") ids = selected;
      else if (mode === "quick")
        ids = [
          "intro",
          "why-axon",
          "shakeur",
          "values",
          "ask-recruiter",
        ].filter((id) => questions.some((q) => q.id === id));
      else if (mode === "full")
        ids = topIds.filter((id) => questions.some((q) => q.id === id));
      else {
        const candidates = questions.filter((q) =>
          mode === "behavioral"
            ? q.stage === "ACE Behavioral"
            : mode === "values"
              ? q.category === "Axon values"
              : ["Traditional Coding", "Engineering with AI"].includes(q.stage),
        );
        ids = candidates.map((q) => q.id);
        for (let i = ids.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        ids = ids.slice(0, 5);
      }
      if (!ids.length) {
        toast("Select at least one question.");
        return;
      }
      const sessionId = crypto.randomUUID();
      const r: Run = {
        sessionId,
        mode,
        ids,
        index: 0,
        elapsed: 0,
        questionStart: 0,
        runningSince: null,
        answer: "",
        ratings: initialRatings(),
        notes: "",
        limit: (modes.find((m) => m.id === mode)?.minutes || 15) * 60,
      };
      await db.transaction("rw", [db.sessions, db.notes], async () => {
        await db.sessions.add({
          id: sessionId,
          mode,
          questionIds: ids,
          startedAt: new Date().toISOString(),
          completedAt: null,
          duration: 0,
        });
        await db.notes.put({
          id: "active-practice",
          value: JSON.stringify(r),
          updatedAt: new Date().toISOString(),
        });
      });
      setRun(r);
      setDone("");
    } catch {
      toast("Could not start the session. Please retry.");
    } finally {
      setStarting(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="LESS READING. MORE RECALL."
        title="Mock interview"
        description="Find your words out loud, then reflect on what made them work."
        action={
          <Badge>
            <Mic size={13} />
            No microphone access or recording
          </Badge>
        }
      />
      {run ? (
        <PracticeRun
          key={run.sessionId}
          initial={run}
          onFinish={(id) => {
            setRun(null);
            setDone(id);
          }}
          onExit={() => setRun(null)}
        />
      ) : (
        <>
          <div className="tabs page-tabs">
            {["Practice modes", "History"].map((t) => (
              <button
                key={t}
                className={tab === t ? "selected" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {done && (
            <Card className="success-card">
              <Check size={24} />
              <h2>Practice, reflected on.</h2>
              <p>
                Your attempts and ratings are saved. Choose one thing to improve
                in your next session.
              </p>
              <button onClick={() => setTab("History")}>
                View practice history
              </button>
            </Card>
          )}
          {tab === "Practice modes" ? (
            <>
              <div className="grid-three">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    className={`practice-mode ${mode === m.id ? "selected" : ""}`}
                    onClick={() => setMode(m.id)}
                  >
                    <span className="eyebrow">{m.tag}</span>
                    <h2>{m.name}</h2>
                    <p>{m.description}</p>
                    <span>
                      {mode === m.id ? "Selected" : "Choose mode"}
                      <ArrowRight size={15} />
                    </span>
                  </button>
                ))}
              </div>
              {params.get("question") && mode === "quick" && (
                <div className="notice">
                  Focused practice:{" "}
                  {questions.find((q) => q.id === selected[0])?.text}
                </div>
              )}
              {mode === "custom" && (
                <Card>
                  <label className="field">
                    Find questions
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search question text…"
                    />
                  </label>
                  <p>{selected.length} selected</p>
                  <div className="scroll-list">
                    {questions
                      .filter((q) =>
                        q.text.toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((q) => (
                        <label className="story-link-check" key={q.id}>
                          <input
                            type="checkbox"
                            checked={selected.includes(q.id)}
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? [...selected, q.id]
                                  : selected.filter((id) => id !== q.id),
                              )
                            }
                          />
                          {q.text}
                        </label>
                      ))}
                  </div>
                </Card>
              )}
              <div className="start-session">
                <div>
                  <h3>Start with what you remember.</h3>
                  <p>
                    Prepared notes stay hidden until you choose to reveal them.
                  </p>
                </div>
                <button
                  className="primary"
                  disabled={starting}
                  onClick={() => void start()}
                >
                  <Play size={16} />
                  Start practice session
                </button>
              </div>
            </>
          ) : (
            <PracticeHistory />
          )}
          {sessions.some((s) => !s.completedAt) && (
            <p className="small muted">
              Incomplete sessions remain in history. {attempts.length} attempts
              saved across all sessions.
            </p>
          )}
        </>
      )}
    </>
  );
}
function PracticeRun({
  initial,
  onFinish,
  onExit,
}: {
  initial: Run;
  onFinish: (id: string) => void;
  onExit: () => void;
}) {
  const { questions, answers, attempts } = useData();
  const toast = useToast();
  const {
    value: r,
    update,
    status,
    flush,
  } = useAutosave("practice-run", initial, async (run) =>
    db.notes.put({
      id: "active-practice",
      value: JSON.stringify(run),
      updatedAt: new Date().toISOString(),
    }),
  );
  const [now, setNow] = useState(Date.now);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);
  const elapsed = elapsedOf(r, now);
  const remaining = r.limit - elapsed;
  const q = questions.find((q) => q.id === r.ids[r.index]);
  const prepared = answerText(answers.find((a) => a.questionId === q?.id));
  const sessionAttempts = attempts.filter((a) => a.sessionId === r.sessionId);
  async function advance(timestamp: number, skip = false, finish = false) {
    if (!q || busy) return;
    setBusy(true);
    try {
      await flushAll();
      const duration = elapsedOf(r, timestamp);
      const complete = finish || r.index === r.ids.length - 1;
      if (complete && skip && !sessionAttempts.length) {
        toast("Save at least one attempt before completing a session.");
        return;
      }
      const date = new Date().toISOString();
      const next: Run = {
        ...r,
        index: r.index + 1,
        elapsed: duration,
        questionStart: duration,
        runningSince: r.runningSince === null ? null : timestamp,
        answer: "",
        notes: "",
        ratings: initialRatings(),
      };
      await db.transaction(
        "rw",
        [db.attempts, db.sessions, db.notes, db.questions, db.reviews],
        async () => {
          if (!skip) {
            await db.attempts.add({
              id: crypto.randomUUID(),
              sessionId: r.sessionId,
              questionId: q.id,
              date,
              duration: Math.round(Math.max(0, duration - r.questionStart)),
              answer: r.answer,
              ratings: r.ratings,
              notes: r.notes,
            });
            await db.questions.update(q.id, { lastPracticed: date });
            await rateQuestion(q.id, r.ratings.confidence);
          }
          if (complete) {
            await db.sessions.update(r.sessionId, {
              completedAt: date,
              duration: Math.round(duration),
            });
            await db.notes.delete("active-practice");
          } else
            await db.notes.put({
              id: "active-practice",
              value: JSON.stringify(next),
              updatedAt: date,
            });
        },
      );
      if (complete) onFinish(r.sessionId);
      else {
        update(next);
        await flush();
        setRevealed(false);
      }
    } catch {
      toast("Could not save this attempt. Your answer is still here; retry.");
    } finally {
      setBusy(false);
    }
  }
  if (!q)
    return (
      <Card>
        <h2>This question is no longer available.</h2>
        <button
          onClick={async () => {
            await db.notes.delete("active-practice");
            onExit();
          }}
        >
          Return to practice
        </button>
      </Card>
    );
  return (
    <div className="practice-run">
      <div className="practice-top">
        <Badge tone="yellow">
          {modes.find((m) => m.id === r.mode)?.name || "Practice"}
        </Badge>
        <span>
          QUESTION {r.index + 1} OF {r.ids.length}
        </span>
        <span className={remaining <= 0 ? "timer over" : "timer"}>
          <Clock3 size={18} />
          {remaining > 0 ? clock(remaining) : `+${clock(-remaining)}`}
        </span>
      </div>
      <div className="progress-track">
        <div style={{ width: `${(100 * r.index) / r.ids.length}%` }} />
      </div>
      <Card className="practice-question">
        <div className="eyebrow">{q.category}</div>
        <h2>{q.text}</h2>
        <p>Take a moment. Then answer aloud or write what you would say.</p>
        <div className="timer-controls">
          <button
            onClick={() => {
              const elapsed = elapsedOf(r, Date.now());
              update({
                ...r,
                elapsed,
                runningSince: r.runningSince === null ? Date.now() : null,
              });
            }}
          >
            {r.runningSince === null ? <Play size={15} /> : <Pause size={15} />}{" "}
            {r.runningSince === null ? "Start timer" : "Pause timer"}
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  "Reset the session timer? Your written attempt will stay.",
                )
              )
                update({
                  ...r,
                  elapsed: 0,
                  questionStart: 0,
                  runningSince: null,
                });
            }}
          >
            <RotateCcw size={14} />
            Reset timer
          </button>
          <button onClick={() => setRevealed(!revealed)}>
            <Eye size={15} />
            {revealed ? "Hide notes" : "Reveal prepared notes"}
          </button>
        </div>
        {remaining <= 0 && (
          <div className="notice">
            Time is up. Finish your thought, then save the attempt and reflect.
          </div>
        )}
        {revealed && (
          <div className="prepared-notes">
            <h3>Prepared answer</h3>
            <p className="preserve-lines">
              {prepared ||
                "No prepared answer yet. Try answering from memory, then add a draft."}
            </p>
            <Link href={questionHref(q.id)}>Open answer editor ↗</Link>
          </div>
        )}
        <label className="field">
          Your practice response
          <textarea
            aria-label="Practice response"
            rows={6}
            value={r.answer}
            onChange={(e) => update({ ...r, answer: e.target.value })}
            placeholder="Write your response, or jot down the main points after answering aloud."
          />
        </label>
        <p className="save-status">{status}</p>
      </Card>
      <Card>
        <h3>How did that feel?</h3>
        <p className="small muted">
          Honest self-ratings, not automated scores. Adjust each from 1 to 5.
        </p>
        <div className="ratings-grid">
          {ratingKeys.map((key) => (
            <Confidence
              key={key}
              label={key[0].toUpperCase() + key.slice(1)}
              value={r.ratings[key]}
              onChange={(n) =>
                update({ ...r, ratings: { ...r.ratings, [key]: n } })
              }
            />
          ))}
        </div>
        <label className="field">
          Feedback and areas to improve
          <textarea
            rows={3}
            value={r.notes}
            onChange={(e) => update({ ...r, notes: e.target.value })}
            placeholder="What worked? What will you change next time?"
          />
        </label>
        <div className="practice-actions">
          <button
            disabled={busy}
            onClick={() => void advance(Date.now(), true)}
          >
            Skip question
          </button>
          <button
            disabled={busy}
            onClick={() => void advance(Date.now(), false, true)}
          >
            Save & finish session
          </button>
          <button
            className="primary"
            disabled={busy}
            onClick={() => void advance(Date.now())}
          >
            {r.index === r.ids.length - 1
              ? "Save & complete session"
              : "Save attempt & next"}
            <ArrowRight size={15} />
          </button>
        </div>
        <p className="small muted">
          Leaving this page preserves your current session. Return to resume it.
        </p>
      </Card>
    </div>
  );
}
function PracticeHistory() {
  const { sessions, attempts, questions } = useData();
  return (
    <div className="history-list">
      {!sessions.length ? (
        <Empty
          title="Your first practice is still ahead"
          description="Start a session to save attempts, self-ratings, and reflections."
        />
      ) : (
        [...sessions]
          .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
          .map((s) => (
            <Card key={s.id}>
              <div className="section-title">
                <h2>{modes.find((m) => m.id === s.mode)?.name || s.mode}</h2>
                <Badge tone={s.completedAt ? "green" : "muted"}>
                  {s.completedAt ? "Completed" : "Incomplete"}
                </Badge>
              </div>
              <p className="small muted">
                {formatDate(s.startedAt)} ·{" "}
                {attempts.filter((a) => a.sessionId === s.id).length} saved
                attempts · {clock(s.duration)}
              </p>
              {attempts
                .filter((a) => a.sessionId === s.id)
                .map((a) => {
                  const earlier = attempts
                    .filter(
                      (x) => x.questionId === a.questionId && x.date < a.date,
                    )
                    .sort((a, b) => b.date.localeCompare(a.date))[0];
                  return (
                    <details key={a.id}>
                      <summary>
                        {questions.find((q) => q.id === a.questionId)?.text} ·
                        Confidence {a.ratings.confidence}/5
                      </summary>
                      <p className="preserve-lines">
                        {a.answer ||
                          "Spoken attempt; no written transcript saved."}
                      </p>
                      <div className="tag-list">
                        {ratingKeys.map((k) => (
                          <Badge key={k}>
                            {k}: {a.ratings[k]}/5
                          </Badge>
                        ))}
                      </div>
                      <p>{a.notes || "No feedback entered."}</p>
                      {earlier && (
                        <p className="small muted">
                          Compared with previous attempt: confidence{" "}
                          {earlier.ratings.confidence} → {a.ratings.confidence}.
                          Self-ratings only.
                        </p>
                      )}
                      <ActionLink href={questionHref(a.questionId)}>
                        Compare with prepared answer
                      </ActionLink>
                    </details>
                  );
                })}
            </Card>
          ))
      )}
    </div>
  );
}
