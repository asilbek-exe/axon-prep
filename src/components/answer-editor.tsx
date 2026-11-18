"use client";
import { questionHref } from "@/lib/paths";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Copy,
  History,
  Star,
  Flag,
  Play,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import { useData, useAutosave, useToast, flushAll } from "@/lib/store";
import { db, saveAnswer, deleteQuestion, rateQuestion } from "@/lib/db";
import {
  Answer,
  Question,
  blankAnswer,
  AnswerField,
  statuses,
  stages,
  priorities,
  answerFields,
} from "@/lib/models";
import { wordCount, coach, formatDate } from "@/lib/logic";
import { Card, Badge, Modal, Confidence, Empty, SourceLink } from "./ui";
const variants: [AnswerField, string][] = [
  ["draft", "Draft"],
  ["polished", "Polished"],
  ["quick", "15 seconds"],
  ["thirty", "30 seconds"],
  ["sixty", "60 seconds"],
  ["bulletNotes", "Bullet points"],
];
export function AnswerEditor({ id }: { id: string }) {
  const data = useData();
  const q = data.questions.find((q) => q.id === id);
  return q ? (
    <Editor
      key={id}
      q={q}
      initial={data.answers.find((a) => a.questionId === id) || blankAnswer(id)}
    />
  ) : (
    <Empty
      title="Question not found"
      description="Return to the question bank to select another question."
    />
  );
}
function Editor({ q, initial }: { q: Question; initial: Answer }) {
  const { questions, stories, versions, attempts, settings } = useData();
  const toast = useToast();
  const router = useRouter();
  const [mode, setMode] = useState<AnswerField | "star">("draft");
  const [history, setHistory] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState("");
  const { value, update, status, flush } = useAutosave(
    `answer-${q.id}`,
    initial,
    (a) => saveAnswer(a),
  );
  const ownVersions = versions
    .filter((v) => v.answerId === q.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const previous = ownVersions.find((v) => v.id === selectedVersion);
  const current =
    mode === "star"
      ? [
          value.starSituation,
          value.starTask,
          value.starAction,
          value.starResult,
          value.starReflection,
        ].join("\n\n")
      : value[mode];
  const index = questions.findIndex((x) => x.id === q.id);
  const historyAttempts = attempts
    .filter((a) => a.questionId === q.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  async function patch(p: Partial<Question>) {
    try {
      await db.questions.update(q.id, {
        ...p,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast("Question update failed. Please retry.");
    }
  }
  async function manualSave() {
    try {
      await flush();
      await saveAnswer(value, true);
      toast("Answer saved. Manual checkpoint added to history.");
    } catch {
      toast("Save failed. Your text is still in the editor. Please retry.");
    }
  }
  return (
    <>
      <div className="editor-nav">
        <Link href="/questions">
          <ArrowLeft size={15} />
          Question bank
        </Link>
        <div>
          <button
            className={`icon-button ${q.favorite ? "yellow-text" : ""}`}
            aria-label="Favorite question"
            aria-pressed={q.favorite}
            onClick={() => void patch({ favorite: !q.favorite })}
          >
            <Star size={17} fill={q.favorite ? "currentColor" : "none"} />
          </button>
          <button
            className={`icon-button ${q.reviewFlag ? "yellow-text" : ""}`}
            aria-label="Flag for review"
            aria-pressed={q.reviewFlag}
            onClick={() => void patch({ reviewFlag: !q.reviewFlag })}
          >
            <Flag size={17} />
          </button>
          <button onClick={() => setEditing(true)}>
            <Pencil size={14} />
            Edit question
          </button>
        </div>
      </div>
      <div className="question-heading">
        <div className="inline-meta">
          <Badge tone="yellow">{q.priority}</Badge>
          <span>{q.stage}</span>
          <span>{q.category}</span>
        </div>
        <h1>{q.text}</h1>
        <p>
          {q.stage === "Recruiter"
            ? "Lead with the point. Keep it conversational."
            : "Make your reasoning and your own contribution clear."}
        </p>
      </div>
      <div className="editor-layout">
        <div>
          <Card className="editor-card">
            <div className="editor-toolbar">
              <div className="tabs">
                {variants.map(([key, title]) => (
                  <button
                    key={key}
                    className={mode === key ? "selected" : ""}
                    onClick={() => setMode(key)}
                  >
                    {title}
                  </button>
                ))}
                <button
                  className={mode === "star" ? "selected" : ""}
                  onClick={() => setMode("star")}
                >
                  STAR
                </button>
              </div>
            </div>
            {value.starter && (
              <div className="starter-notice">
                Suggested starter draft · Review and edit in your own voice.
                This is not counted as your completed answer.
                <button onClick={() => update({ ...value, starter: false })}>
                  Use as my draft
                </button>
              </div>
            )}
            {mode === "star" ? (
              <div className="star-fields">
                {(
                  [
                    "starSituation",
                    "starTask",
                    "starAction",
                    "starResult",
                    "starReflection",
                  ] as AnswerField[]
                ).map((f) => (
                  <label className="field" key={f}>
                    {f.replace("star", "")}
                    <textarea
                      rows={4}
                      value={value[f]}
                      onChange={(e) =>
                        update({
                          ...value,
                          [f]: e.target.value,
                          starter: false,
                        })
                      }
                      onBlur={() => void flush().catch(() => {})}
                      placeholder={
                        f === "starResult"
                          ? "What actually changed? Keep metrics within the evidence you have."
                          : f === "starAction"
                            ? "What did you personally decide and do?"
                            : "Add a specific, true detail from your experience."
                      }
                    />
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="answer-textarea"
                aria-label="Your answer"
                value={value[mode]}
                placeholder={
                  mode === "draft"
                    ? "Start with your own words. What do you want the interviewer to remember?"
                    : "Write this version independently. Your other versions will stay intact."
                }
                onChange={(e) =>
                  update({ ...value, [mode]: e.target.value, starter: false })
                }
                onBlur={() => void flush().catch(() => {})}
              />
            )}
            <div className="editor-bottom">
              <span>
                {wordCount(current)} words{" "}
                <span className="muted">
                  · ~
                  {Math.ceil(
                    (wordCount(current) / settings[0].speakingRate) * 60,
                  )}{" "}
                  sec
                </span>
              </span>
              <span
                className={
                  status.startsWith("Save failed") ? "error" : "save-status"
                }
                role="status"
              >
                {status === "Saved" && <Check size={13} />} {status}
              </span>
            </div>
            <div className="editor-actions">
              <button className="primary" onClick={() => void manualSave()}>
                <Save size={15} />
                Save answer
              </button>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(current);
                    toast("Current answer version copied.");
                  } catch {
                    toast(
                      "Clipboard unavailable. Select and copy the text manually.",
                    );
                  }
                }}
              >
                <Copy size={15} />
                Copy
              </button>
              <button onClick={() => setHistory(true)}>
                <History size={15} />
                Versions ({ownVersions.length})
              </button>
            </div>
          </Card>
          <div className="editor-state">
            <label className="field">
              Preparation status
              <select
                aria-label="Preparation status"
                value={q.status}
                onChange={(e) =>
                  void patch({ status: e.target.value as Question["status"] })
                }
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <button
              onClick={async () => {
                try {
                  await flushAll();
                  await patch({ status: "Ready to Practice" });
                } catch {
                  toast("Save the answer before changing readiness.");
                }
              }}
            >
              <Check size={15} />
              Mark as ready
            </button>
            <Link
              className="button primary"
              href={`/practice?question=${q.id}`}
            >
              <Play size={15} />
              Practice this answer
            </Link>
          </div>
          <Card>
            <h3>Writing check</h3>
            <p className="small muted">
              Rule-based prompts, not AI feedback. Your writing is never changed
              automatically.
            </p>
            <ul className="point-list">
              {coach(current, q.stage, settings[0].speakingRate).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Card>
          <div className="previous-next">
            {index > 0 ? (
              <Link href={questionHref(questions[index - 1].id)}>
                <ArrowLeft size={15} />
                Previous question
              </Link>
            ) : (
              <span />
            )}
            {index < questions.length - 1 && (
              <Link href={questionHref(questions[index + 1].id)}>
                Next question
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
          <Card>
            <h3>Practice history</h3>
            {historyAttempts.length ? (
              historyAttempts.map((a) => (
                <details key={a.id}>
                  <summary>
                    {formatDate(a.date)} · {a.duration}s · Confidence{" "}
                    {a.ratings.confidence}/5
                  </summary>
                  <p className="preserve-lines">
                    {a.answer || "Spoken practice; no transcript entered."}
                  </p>
                  <p>{a.notes}</p>
                </details>
              ))
            ) : (
              <p className="muted">
                No attempts yet. Practice once to hear where your answer can
                become clearer.
              </p>
            )}
          </Card>
        </div>
        <aside className="context-panel">
          <Card>
            <div className="eyebrow">ANSWER COMPASS</div>
            <h3>What they’re listening for</h3>
            <p>
              {q.stage === "ACE Behavioral"
                ? "Specific behavior, accountability, learning, and how you work with others."
                : q.stage === "Recruiter"
                  ? "A clear introduction to your interests, experience, and fit for the opportunity."
                  : "Problem framing, technical judgment, correctness, and clear communication."}
            </p>
            <h3>What to emphasize</h3>
            <p>{q.guidance}</p>
            <h3>Common pitfalls</h3>
            <p>
              Unclear personal contribution, an overly long setup, unsupported
              results, or a script that sounds memorized.
            </p>
            <h3>Suggested length</h3>
            <p>
              {q.stage === "Recruiter"
                ? "30–60 seconds; introduction around 45 seconds."
                : "60–120 seconds for an initial explanation, then invite follow-up questions."}
            </p>
            <SourceLink href="/company">Relevant company facts</SourceLink>
          </Card>
          <Card>
            <h3>Connect a story</h3>
            <p className="small muted">
              Use one experience across different questions.
            </p>
            {stories
              .filter((s) => !s.archived)
              .map((s) => (
                <label key={s.id} className="story-link-check">
                  <input
                    type="checkbox"
                    checked={q.linkedStoryIds.includes(s.id)}
                    onChange={(e) =>
                      void patch({
                        linkedStoryIds: e.target.checked
                          ? [...q.linkedStoryIds, s.id]
                          : q.linkedStoryIds.filter((id) => id !== s.id),
                      })
                    }
                  />
                  <span>
                    {s.title}
                    <Link href={`/stories?story=${s.id}`}>Open story ↗</Link>
                  </span>
                </label>
              ))}
          </Card>
          <Card>
            <Confidence
              value={q.confidence}
              onChange={(n) =>
                void rateQuestion(q.id, n).catch(() =>
                  toast("Could not save confidence."),
                )
              }
            />
            {q.nextReview && (
              <p className="small muted">
                Next review: {formatDate(q.nextReview)}
              </p>
            )}
          </Card>
          <QuestionNotes key={q.id} q={q} />
          <p className="small muted">
            {q.source}
            <br />
            Last edited: {formatDate(q.updatedAt)}
          </p>
        </aside>
      </div>
      {history && (
        <Modal title="Answer version history" onClose={() => setHistory(false)}>
          <p>
            Automatic checkpoints are spaced at least 30 seconds apart. Manual
            saves create a checkpoint of the current answer. The latest 30
            checkpoints are kept.
          </p>
          {ownVersions.length ? (
            <>
              <label className="field">
                Choose a previous version
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                >
                  <option value="">Select a version</option>
                  {ownVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {new Date(v.createdAt).toLocaleString()} · {v.label}
                    </option>
                  ))}
                </select>
              </label>
              {previous && (
                <>
                  <div className="compare-grid">
                    <div>
                      <h3>Previous</h3>
                      <p className="preserve-lines">
                        {versionText(previous.snapshot)}
                      </p>
                    </div>
                    <div>
                      <h3>Current</h3>
                      <p className="preserve-lines">{versionText(value)}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (
                        !confirm(
                          "Restore all answer variants from this version? Your current version will be preserved.",
                        )
                      )
                        return;
                      try {
                        await flush();
                        await db.versions.add({
                          id: crypto.randomUUID(),
                          answerId: value.id,
                          snapshot: value,
                          label: "Before restore",
                          createdAt: new Date().toISOString(),
                        });
                        update({
                          ...previous.snapshot,
                          updatedAt: new Date().toISOString(),
                        });
                        await flush();
                        setHistory(false);
                        toast("Version restored.");
                      } catch {
                        toast("Could not restore version.");
                      }
                    }}
                  >
                    Restore this version
                  </button>
                </>
              )}
            </>
          ) : (
            <Empty
              title="No previous versions yet"
              description="Edit your answer and save to begin a version history."
            />
          )}
        </Modal>
      )}
      {editing && (
        <Modal title="Edit question" onClose={() => setEditing(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await patch({
                text: String(f.get("text")),
                category: String(f.get("category")),
                stage: f.get("stage") as Question["stage"],
                priority: f.get("priority") as Question["priority"],
                guidance: String(f.get("guidance")),
                tags: String(f.get("tags"))
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              });
              setEditing(false);
            }}
          >
            <label className="field">
              Question
              <input required name="text" defaultValue={q.text} />
            </label>
            <label className="field">
              Category
              <input required name="category" defaultValue={q.category} />
            </label>
            <div className="form-grid">
              <label className="field">
                Round
                <select name="stage" defaultValue={q.stage}>
                  {stages.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Priority
                <select name="priority" defaultValue={q.priority}>
                  {priorities.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              Tags
              <input name="tags" defaultValue={q.tags.join(", ")} />
            </label>
            <label className="field">
              Guidance
              <textarea name="guidance" defaultValue={q.guidance} />
            </label>
            <button type="submit" className="primary">
              Save question
            </button>
            {q.custom && (
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  if (
                    !confirm(
                      "Delete this custom question, its answer, versions, and practice attempts?",
                    )
                  )
                    return;
                  try {
                    await flushAll();
                    await deleteQuestion(q.id);
                    router.push("/questions");
                  } catch {
                    toast("Delete failed.");
                  }
                }}
              >
                <Trash2 size={14} />
                Delete custom question
              </button>
            )}
          </form>
        </Modal>
      )}
    </>
  );
}
function QuestionNotes({ q }: { q: Question }) {
  const { value, update, status, flush } = useAutosave(
    `question-notes-${q.id}`,
    q.notes,
    async (notes) =>
      db.questions.update(q.id, { notes, updatedAt: new Date().toISOString() }),
  );
  return (
    <Card>
      <label className="field">
        Personal notes
        <textarea
          value={value}
          rows={5}
          onChange={(e) => update(e.target.value)}
          onBlur={() => void flush().catch(() => {})}
          placeholder="Details to check or a point to return to…"
        />
        <span className="save-status">{status}</span>
      </label>
    </Card>
  );
}

function versionText(answer: Answer) {
  return answerFields
    .filter((field) => answer[field].trim())
    .map((field) => `${field}:\n${answer[field]}`)
    .join("\n\n");
}
