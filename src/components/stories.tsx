"use client";
import { questionHref } from "@/lib/paths";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Copy, Archive, ArrowUpRight } from "lucide-react";
import { useData, useAutosave, useToast, flushAll } from "@/lib/store";
import { db } from "@/lib/db";
import { Story } from "@/lib/models";
import { values } from "@/data/company";
import { PageHeader, Card, Badge, Modal, Confidence, Empty } from "./ui";
export function StoryBank() {
  const { stories, questions } = useData();
  const params = useSearchParams();
  const [chosen, setChosen] = useState(params.get("story") || "");
  const [archived, setArchived] = useState(false);
  const toast = useToast();
  const selected = stories.find((s) => s.id === chosen);
  return (
    <>
      <PageHeader
        eyebrow="EXPERIENCE, READY TO RECALL"
        title="Your story bank"
        description="A few real stories. Many ways to show how you think, build, and work with others."
        action={
          <button
            className="primary"
            onClick={async () => {
              const story: Story = {
                id: crypto.randomUUID(),
                title: "Untitled story",
                summary: "",
                situation: "",
                task: "",
                action: "",
                result: "",
                reflection: "",
                technologies: [],
                skills: [],
                valueIds: [],
                sourceNotes: "Personal story",
                confidence: 0,
                archived: false,
                updatedAt: new Date().toISOString(),
              };
              try {
                await db.stories.add(story);
                setChosen(story.id);
              } catch {
                toast("Could not create story.");
              }
            }}
          >
            <Plus size={15} />
            New story
          </button>
        }
      />
      <div className="notice">
        The starting templates contain supplied facts, not invented incidents.
        Add your specific decision, result, and reflection to make each story
        interview-ready.
      </div>
      <div className="section-title">
        <h2>{stories.filter((s) => !s.archived).length} active stories</h2>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>
      <div className="grid-three">
        {stories
          .filter((s) => archived || !s.archived)
          .map((s, i) => {
            const complete = [
              s.situation,
              s.task,
              s.action,
              s.result,
              s.reflection,
            ].filter((x) => x.trim()).length;
            return (
              <Card key={s.id} className="story-card">
                <div className="story-top">
                  <span className="story-symbol">
                    {["⌘", "↔", "⌥", "◉", "⌁", "◇"][i % 6]}
                  </span>
                  <Badge>
                    {s.archived ? "Archived" : `${complete}/5 STAR fields`}
                  </Badge>
                </div>
                <h2>{s.title}</h2>
                <p>
                  {s.summary || "Add a real experience you want to remember."}
                </p>
                <div className="tag-list">
                  {s.valueIds.map((v) => (
                    <Badge key={v} tone={v === "Own It" ? "yellow" : "muted"}>
                      {v}
                    </Badge>
                  ))}
                </div>
                <div className="story-bottom">
                  <span>
                    {
                      questions.filter((q) => q.linkedStoryIds.includes(s.id))
                        .length
                    }{" "}
                    linked questions
                  </span>
                  <button onClick={() => setChosen(s.id)}>
                    Shape story
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
      </div>
      {!stories.length && (
        <Empty
          title="Your first story starts here"
          description="Add an experience, then connect it to questions and values."
        />
      )}
      {selected && (
        <Modal
          title="Shape your story"
          onClose={() =>
            void flushAll()
              .then(() => setChosen(""))
              .catch(() => toast("Please retry saving before closing."))
          }
        >
          <StoryEditor
            key={selected.id}
            story={selected}
            onClose={() => setChosen("")}
            onDuplicate={setChosen}
          />
        </Modal>
      )}
    </>
  );
}
function StoryEditor({
  story,
  onClose,
  onDuplicate,
}: {
  story: Story;
  onClose: () => void;
  onDuplicate: (id: string) => void;
}) {
  const { questions } = useData();
  const toast = useToast();
  const { value, update, status, flush } = useAutosave(
    `story-${story.id}`,
    story,
    async (s) =>
      db.stories.put({
        ...s,
        title: s.title.trim() || "Untitled story",
        updatedAt: new Date().toISOString(),
      }),
  );
  return (
    <>
      <label className="field">
        Title
        <input
          value={value.title}
          onChange={(e) => update({ ...value, title: e.target.value })}
        />
      </label>
      <label className="field">
        Summary
        <textarea
          rows={2}
          value={value.summary}
          onChange={(e) => update({ ...value, summary: e.target.value })}
        />
      </label>
      {(["situation", "task", "action", "result", "reflection"] as const).map(
        (field, i) => (
          <label className="field" key={field}>
            {field[0].toUpperCase() + field.slice(1)}
            <textarea
              aria-label={field[0].toUpperCase() + field.slice(1)}
              rows={3}
              value={value[field]}
              placeholder={
                [
                  "What was happening? Keep the context short.",
                  "What specific problem were you responsible for?",
                  "What did you personally decide and do?",
                  "What actually changed? Include only supported outcomes.",
                  "What did you learn? What would you do differently?",
                ][i]
              }
              onChange={(e) => update({ ...value, [field]: e.target.value })}
            />
          </label>
        ),
      )}
      <div className="form-grid">
        <label className="field">
          Technologies (comma-separated)
          <input
            value={value.technologies.join(", ")}
            onChange={(e) =>
              update({
                ...value,
                technologies: e.target.value.split(",").map((s) => s.trim()),
              })
            }
          />
        </label>
        <label className="field">
          Skills (comma-separated)
          <input
            value={value.skills.join(", ")}
            onChange={(e) =>
              update({
                ...value,
                skills: e.target.value.split(",").map((s) => s.trim()),
              })
            }
          />
        </label>
      </div>
      <h3>Values demonstrated</h3>
      <div className="tag-list">
        {values.map((v) => (
          <label className="inline-check" key={v.name}>
            <input
              type="checkbox"
              checked={value.valueIds.includes(v.name)}
              onChange={(e) =>
                update({
                  ...value,
                  valueIds: e.target.checked
                    ? [...value.valueIds, v.name]
                    : value.valueIds.filter((x) => x !== v.name),
                })
              }
            />
            {v.name}
          </label>
        ))}
      </div>
      <Confidence
        value={value.confidence}
        onChange={(n) => update({ ...value, confidence: n })}
      />
      <h3>Related questions</h3>
      <div className="scroll-list">
        {questions.map((q) => (
          <label className="story-link-check" key={q.id}>
            <input
              type="checkbox"
              checked={q.linkedStoryIds.includes(story.id)}
              onChange={(e) =>
                void db.questions
                  .update(q.id, {
                    linkedStoryIds: e.target.checked
                      ? [...q.linkedStoryIds, story.id]
                      : q.linkedStoryIds.filter((id) => id !== story.id),
                  })
                  .catch(() => toast("Could not link question."))
              }
            />
            <Link href={questionHref(q.id)}>{q.text}</Link>
          </label>
        ))}
      </div>
      <p className="small muted">{story.sourceNotes}</p>
      <div className="sticky-actions">
        <span className="save-status">{status}</span>
        <button
          className="primary"
          onClick={() =>
            void flush()
              .then(() => toast("Story saved."))
              .catch(() => toast("Save failed. Please retry."))
          }
        >
          Save story
        </button>
        <button
          onClick={async () => {
            try {
              await flush();
              const id = crypto.randomUUID();
              await db.stories.add({
                ...value,
                id,
                title: `${value.title} (copy)`,
                updatedAt: new Date().toISOString(),
              });
              onDuplicate(id);
            } catch {
              toast("Could not duplicate story.");
            }
          }}
        >
          <Copy size={14} />
          Duplicate
        </button>
        <button
          onClick={async () => {
            if (
              !value.archived &&
              !confirm(
                "Archive this story? It stays in your backup and can be restored.",
              )
            )
              return;
            try {
              await flush();
              await db.stories.update(story.id, { archived: !value.archived });
              onClose();
            } catch {
              toast("Could not update archive state.");
            }
          }}
        >
          <Archive size={14} />
          {value.archived ? "Unarchive" : "Archive"}
        </button>
      </div>
    </>
  );
}
