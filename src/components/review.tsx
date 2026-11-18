"use client";
import { questionHref } from "@/lib/paths";
import { useState } from "react";
import Link from "next/link";
import { Eye, ArrowRight } from "lucide-react";
import { useData, useToast } from "@/lib/store";
import { rateQuestion } from "@/lib/db";
import { hasAnswer, answerText, formatDate } from "@/lib/logic";
import { PageHeader, Card, QuestionRow, Empty, Confidence, Badge } from "./ui";
export function Review() {
  const { questions, answers, reviews } = useData();
  const toast = useToast();
  const [now] = useState(Date.now);
  const [tab, setTab] = useState("Due today");
  const [active, setActive] = useState("");
  const [reveal, setReveal] = useState(false);
  const [recall, setRecall] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = questions.filter((q) =>
    tab === "Due today"
      ? q.reviewFlag || (!!q.nextReview && Date.parse(q.nextReview) <= now)
      : tab === "Weak answers"
        ? q.confidence > 0 && q.confidence < 3
        : tab === "Critical unanswered"
          ? q.priority === "Critical" &&
            (!hasAnswer(answers.find((a) => a.questionId === q.id)) ||
              answers.find((a) => a.questionId === q.id)?.starter)
          : tab === "Recently improved"
            ? reviews.some(
                (r) =>
                  r.questionId === q.id && r.confidence > r.previousConfidence,
              )
            : q.status === "Mastered",
  );
  const q = questions.find((q) => q.id === active);
  return (
    <>
      <PageHeader
        eyebrow="MAKE IT STICK"
        title="Review & progress"
        description="Recall first. Reveal second. Spend more time on the answers that need it."
      />
      <Card className="review-explainer">
        <div>
          <h2>A simple rhythm for remembering.</h2>
          <p>
            Your confidence determines when a question returns. Lower ratings
            bring it back sooner.
          </p>
        </div>
        <div className="review-intervals">
          {["4 hours", "1 day", "3 days", "7 days", "14 days"].map((v, i) => (
            <div key={v}>
              <strong>{i + 1}</strong>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="tabs page-tabs">
        {[
          "Due today",
          "Weak answers",
          "Critical unanswered",
          "Recently improved",
          "Mastered",
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {q ? (
        <Card className="recall-card">
          <Badge tone="yellow">ACTIVE RECALL</Badge>
          <h2>{q.text}</h2>
          <label className="field">
            Recall notes · temporary scratchpad
            <textarea
              rows={4}
              value={recall}
              onChange={(e) => setRecall(e.target.value)}
              placeholder="Try answering without looking. Only your confidence rating is saved here; use Mock Interview to save an attempt."
            />
          </label>
          <button onClick={() => setReveal(!reveal)}>
            <Eye size={16} />
            {reveal ? "Hide answer" : "Reveal my answer"}
          </button>
          {reveal && (
            <>
              <div className="prepared-notes">
                <p className="preserve-lines">
                  {answerText(answers.find((a) => a.questionId === q.id)) ||
                    "No saved answer. Write one after this recall attempt."}
                </p>
              </div>
              <div aria-busy={busy}>
                <Confidence
                  value={q.confidence}
                  label="Recall confidence"
                  onChange={async (n) => {
                    if (busy) return;
                    setBusy(true);
                    try {
                      await rateQuestion(q.id, n);
                      toast("Review saved. Next review scheduled.");
                      setActive("");
                      setReveal(false);
                      setRecall("");
                    } catch {
                      toast("Could not save review.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </div>
            </>
          )}
          <div className="actions">
            <Link className="button" href={questionHref(q.id)}>
              Edit answer
              <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => {
                setActive("");
                setRecall("");
              }}
            >
              Back to queue
            </button>
          </div>
        </Card>
      ) : (
        <Card className="question-list">
          {filtered.length ? (
            filtered.map((q) => (
              <div className="review-row" key={q.id}>
                <QuestionRow q={q} />
                <button
                  onClick={() => {
                    setActive(q.id);
                    setReveal(false);
                    setRecall("");
                  }}
                >
                  Active recall
                  <ArrowRight size={14} />
                </button>
              </div>
            ))
          ) : (
            <Empty
              title="Nothing in this queue"
              description={
                tab === "Due today"
                  ? "Rate a question or complete practice to build your review schedule."
                  : "Try another queue or continue working on your answers."
              }
            />
          )}
        </Card>
      )}
      <Card>
        <h3>Recent reviews</h3>
        {reviews.length ? (
          [...reviews]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 8)
            .map((r) => (
              <p key={r.id}>
                <Link href={questionHref(r.questionId)}>
                  {questions.find((q) => q.id === r.questionId)?.text}
                </Link>
                <span className="muted">
                  {" "}
                  · {r.previousConfidence || "Unrated"} → {r.confidence}/5 ·{" "}
                  {formatDate(r.date)}
                </span>
              </p>
            ))
        ) : (
          <p className="muted">No reviews completed yet.</p>
        )}
      </Card>
    </>
  );
}
