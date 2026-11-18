"use client";
import { questionHref } from "@/lib/paths";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Download } from "lucide-react";
import { useData, useToast, flushAll } from "@/lib/store";
import { db, downloadFile } from "@/lib/db";
import { Question, statuses, stages, priorities } from "@/lib/models";
import {
  priorityOrder,
  answerText,
  wordCount,
  hasAnswer,
  formatDate,
} from "@/lib/logic";
import { PageHeader, Card, QuestionRow, Empty, Modal } from "./ui";
export function QuestionBank({
  answersOnly = false,
}: {
  answersOnly?: boolean;
}) {
  const { questions, answers } = useData();
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [stage, setStage] = useState("All rounds");
  const [priority, setPriority] = useState(
    params.get("priority") || "All priorities",
  );
  const [status, setStatus] = useState("All statuses");
  const [tag, setTag] = useState("All tags");
  const [sort, setSort] = useState("Importance");
  const [view, setView] = useState("All answers");
  const [favorites, setFavorites] = useState(false);
  const [create, setCreate] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = questions
    .filter((q) => {
      const a = answers.find((a) => a.questionId === q.id);
      return (
        (!search ||
          [q.text, q.category, ...q.tags, q.notes]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())) &&
        (category === "All categories" || q.category === category) &&
        (stage === "All rounds" || q.stage === stage) &&
        (priority === "All priorities" || q.priority === priority) &&
        (status === "All statuses" || q.status === status) &&
        (tag === "All tags" || q.tags.includes(tag)) &&
        (!favorites || q.favorite) &&
        (!answersOnly ||
          (view === "Unanswered"
            ? !hasAnswer(a)
            : view === "Weak answers"
              ? q.confidence > 0 && q.confidence < 3
              : view === "Final answers"
                ? !!a?.polished.trim()
                : view === "Drafts"
                  ? !!a?.draft.trim() && q.status === "Drafting"
                  : hasAnswer(a)))
      );
    })
    .sort((a, b) =>
      sort === "Recently updated" || view === "Recently updated"
        ? b.updatedAt.localeCompare(a.updatedAt)
        : sort === "Confidence"
          ? a.confidence - b.confidence
          : priorityOrder(a, b),
    );
  async function exportSelected() {
    await flushAll();
    const rows = await db.answers.bulkGet(selected);
    const md = selected
      .map(
        (id, i) =>
          `# ${questions.find((q) => q.id === id)?.text}\n\n${answerText(rows[i])}\n\nStatus: ${questions.find((q) => q.id === id)?.status}\n`,
      )
      .join("\n---\n\n");
    downloadFile("axon-selected-answers.md", md, "text/markdown");
    toast("Selected answers exported.");
  }
  return (
    <>
      <PageHeader
        eyebrow={
          answersOnly ? "YOUR WORDS, YOUR EXPERIENCE" : "BUILD YOUR ANSWERS"
        }
        title={answersOnly ? "My answers" : "Question bank"}
        description={
          answersOnly
            ? "A home for your drafts, polished responses, and the ideas worth remembering."
            : `${questions.length} thoughtful prompts. Start with the ones that matter most.`
        }
        action={
          answersOnly ? (
            <button
              disabled={!selected.length}
              onClick={() =>
                void exportSelected().catch(() =>
                  toast("Export failed. Retry after saving."),
                )
              }
            >
              <Download size={16} />
              Export selected ({selected.length})
            </button>
          ) : (
            <button className="primary" onClick={() => setCreate(true)}>
              <Plus size={16} />
              New question
            </button>
          )
        }
      />
      <Card className="filter-card">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search questions"
            placeholder="Search by question, topic, or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span>{filtered.length} results</span>
        </div>
        <div className="filters">
          {[
            [
              category,
              setCategory,
              ["All categories", ...new Set(questions.map((q) => q.category))],
              "Category",
            ],
            [stage, setStage, ["All rounds", ...stages], "Round"],
            [
              priority,
              setPriority,
              ["All priorities", ...priorities],
              "Priority",
            ],
            [status, setStatus, ["All statuses", ...statuses], "Status"],
            [
              tag,
              setTag,
              ["All tags", ...new Set(questions.flatMap((q) => q.tags))],
              "Tag",
            ],
            [
              sort,
              setSort,
              ["Importance", "Recently updated", "Confidence"],
              "Sort",
            ],
          ].map(([v, set, opts, label]) => (
            <select
              key={String(label)}
              aria-label={String(label)}
              value={v as string}
              onChange={(e) => (set as (s: string) => void)(e.target.value)}
            >
              {(opts as string[]).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ))}
          <label className="inline-check">
            <input
              type="checkbox"
              checked={favorites}
              onChange={(e) => setFavorites(e.target.checked)}
            />
            Favorites
          </label>
        </div>
        {answersOnly && (
          <div className="tabs">
            {[
              "All answers",
              "Drafts",
              "Final answers",
              "Unanswered",
              "Weak answers",
              "Recently updated",
            ].map((v) => (
              <button
                key={v}
                className={view === v ? "selected" : ""}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </Card>
      <Card className="question-list">
        {filtered.length ? (
          filtered.map((q) => {
            const a = answers.find((a) => a.questionId === q.id);
            return (
              <div className="answer-list-row" key={q.id}>
                {answersOnly && (
                  <input
                    type="checkbox"
                    aria-label={`Select ${q.text}`}
                    checked={selected.includes(q.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, q.id]
                          : selected.filter((id) => id !== q.id),
                      )
                    }
                  />
                )}
                <div>
                  <QuestionRow
                    q={q}
                    preview={
                      answersOnly ? answerText(a).slice(0, 150) : undefined
                    }
                  />
                  {answersOnly && (
                    <div className="answer-metadata">
                      {wordCount(answerText(a))} words · Updated{" "}
                      {formatDate(a?.updatedAt || q.updatedAt)} · Last practiced{" "}
                      {q.lastPracticed ? formatDate(q.lastPracticed) : "Never"}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <Empty
            title="No questions here yet"
            description="Try a different filter, or create a question of your own."
          />
        )}
      </Card>
      {create && (
        <Modal title="Create a question" onClose={() => setCreate(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const now = new Date().toISOString();
              const q: Question = {
                id: crypto.randomUUID(),
                companyId: "axon",
                text: String(f.get("text")).trim(),
                category: String(f.get("category")) || "Custom",
                stage: f.get("stage") as Question["stage"],
                priority: f.get("priority") as Question["priority"],
                tags: String(f.get("tags"))
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                source: "Personal question",
                guidance: String(f.get("guidance")),
                linkedStoryIds: [],
                status: "Not Started",
                confidence: 0,
                favorite: false,
                reviewFlag: false,
                custom: true,
                notes: "",
                nextReview: null,
                lastPracticed: null,
                createdAt: now,
                updatedAt: now,
              };
              if (!q.text) return;
              try {
                await db.questions.add(q);
                setCreate(false);
                router.push(questionHref(q.id));
              } catch {
                toast("Could not create question.");
              }
            }}
          >
            <label className="field">
              Question
              <input name="text" required autoFocus />
            </label>
            <div className="form-grid">
              <label className="field">
                Category
                <input name="category" defaultValue="Custom" />
              </label>
              <label className="field">
                Round
                <select name="stage">
                  {stages.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Priority
                <select name="priority">
                  {priorities.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Tags, separated by commas
                <input name="tags" />
              </label>
            </div>
            <label className="field">
              Guidance
              <textarea
                name="guidance"
                placeholder="What do you want this answer to communicate?"
              />
            </label>
            <button className="primary" type="submit">
              Create question
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
