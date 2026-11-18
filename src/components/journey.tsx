"use client";
import { useState } from "react";
import { Plus, Check, CalendarDays, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useData, useAutosave, useToast, flushAll } from "@/lib/store";
import { db } from "@/lib/db";
import { InterviewEvent } from "@/lib/models";
import { emptyEvent } from "@/data/seed";
import { formatDate, eventState } from "@/lib/logic";
import { PageHeader, Card, Badge, Modal } from "./ui";
export function Journey() {
  const { events } = useData();
  const [selected, setSelected] = useState("");
  const toast = useToast();
  const event = events.find((e) => e.id === selected);
  return (
    <>
      <PageHeader
        eyebrow="A CONVERSATION IN PROGRESS"
        title="My Axon Journey"
        description="The real moments, people, and next steps that brought you here."
        action={
          <button
            className="primary"
            onClick={async () => {
              const e = emptyEvent(
                crypto.randomUUID(),
                "New interview event",
                new Intl.DateTimeFormat("en-CA", {
                  timeZone: "America/New_York",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(new Date()),
              );
              try {
                await db.events.add(e);
                setSelected(e.id);
              } catch {
                toast("Could not create event.");
              }
            }}
          >
            <Plus size={15} />
            Add event
          </button>
        }
      />
      <div className="journey-layout">
        <div className="timeline">
          {[...events]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((e) => (
              <article
                className={`timeline-event ${e.completed ? "done" : ""}`}
                key={e.id}
              >
                <span className="timeline-dot">
                  {e.completed ? (
                    <Check size={14} />
                  ) : (
                    <CalendarDays size={14} />
                  )}
                </span>
                <div className="timeline-date">
                  {formatDate(e.date)}
                  {e.id === "code" ? " – October 20" : ""}
                </div>
                <Card>
                  <div className="section-title">
                    <h2>{e.title}</h2>
                    <Badge tone={e.completed ? "green" : "yellow"}>
                      {e.completed ? "Completed" : eventState(e)}
                    </Badge>
                  </div>
                  {e.interviewer && (
                    <p className="yellow-text">{e.interviewer}</p>
                  )}
                  <p
                    className={`preserve-lines ${e.id === "nache" ? "meeting-recap" : ""}`}
                  >
                    {e.notes}
                  </p>
                  {e.nextSteps && (
                    <p>
                      <strong>Next steps:</strong> {e.nextSteps}
                    </p>
                  )}
                  <button onClick={() => setSelected(e.id)}>
                    Edit event & reflection
                    <ArrowUpRight size={14} />
                  </button>
                </Card>
              </article>
            ))}
        </div>
        <div>
          <Card className="journey-context">
            <div className="eyebrow">YOUR PERSONAL CONNECTION</div>
            <h2>Start with what you learned.</h2>
            <p>
              The AfroTech meeting gave you an authentic connection to Axon’s
              engineering work, especially hardware/software collaboration and
              Own It.
            </p>
            <p>
              A positive conversation is useful context. A personal
              recommendation has not been confirmed.
            </p>
            <Link href="/questions/afrotech" className="button">
              Practice referencing the meeting
              <ArrowUpRight size={14} />
            </Link>
          </Card>
          <Card>
            <h3>Close the loop</h3>
            <p>
              After each interview, record what was asked, what went well, and
              the next actions. Passing a scheduled time does not automatically
              mark an interview complete.
            </p>
          </Card>
        </div>
      </div>
      {event && (
        <Modal
          title="Interview details & reflection"
          onClose={() =>
            void flushAll()
              .then(() => setSelected(""))
              .catch(() => toast("Save failed. Retry before closing."))
          }
        >
          <EventEditor key={event.id} event={event} />
        </Modal>
      )}
    </>
  );
}
function EventEditor({ event }: { event: InterviewEvent }) {
  const { questions } = useData();
  const toast = useToast();
  const { value, update, status, flush } = useAutosave(
    `event-${event.id}`,
    event,
    async (e) =>
      db.events.put({
        ...e,
        title: e.title.trim() || "Untitled event",
        updatedAt: new Date().toISOString(),
      }),
  );
  return (
    <>
      <label className="field">
        Event title
        <input
          value={value.title}
          onChange={(e) => update({ ...value, title: e.target.value })}
        />
      </label>
      <div className="form-grid">
        <label className="field">
          Date
          <input
            type="date"
            value={value.date}
            onChange={(e) => {
              if (e.target.value) update({ ...value, date: e.target.value });
            }}
          />
        </label>
        <label className="field">
          Time · America/New_York
          <input
            type="time"
            value={value.time}
            onChange={(e) => {
              if (e.target.value) update({ ...value, time: e.target.value });
            }}
          />
        </label>
        <label className="field">
          Duration in minutes
          <input
            type="number"
            min="1"
            max="1440"
            value={value.duration}
            onChange={(e) =>
              update({
                ...value,
                duration: Math.min(1440, Math.max(1, Number(e.target.value))),
              })
            }
          />
        </label>
        <label className="field">
          Interviewer
          <input
            value={value.interviewer}
            onChange={(e) => update({ ...value, interviewer: e.target.value })}
          />
        </label>
      </div>
      <label className="inline-check">
        <input
          type="checkbox"
          checked={value.completed}
          onChange={(e) => update({ ...value, completed: e.target.checked })}
        />
        Mark event complete
      </label>
      <label className="field">
        Meeting recap / notes
        <textarea
          rows={7}
          value={value.notes}
          onChange={(e) => update({ ...value, notes: e.target.value })}
        />
      </label>
      <h3>Before the interview</h3>
      {(
        [
          ["goals", "Goals and talking points"],
          ["questions", "Prepared questions"],
          ["concerns", "Concerns"],
        ] as const
      ).map(([f, label]) => (
        <label className="field" key={f}>
          {label}
          <textarea
            rows={2}
            value={value[f]}
            onChange={(e) => update({ ...value, [f]: e.target.value })}
          />
        </label>
      ))}
      <h3>After the interview</h3>
      {(
        [
          ["asked", "Questions asked"],
          ["answered", "How I answered"],
          ["wentWell", "What went well"],
          ["improve", "What could have gone better"],
          ["feedback", "Recruiter feedback"],
          ["nextSteps", "Next steps"],
          ["followUp", "Follow-up actions"],
        ] as const
      ).map(([f, label]) => (
        <label className="field" key={f}>
          {label}
          <textarea
            rows={2}
            value={value[f]}
            onChange={(e) => update({ ...value, [f]: e.target.value })}
          />
        </label>
      ))}
      <details>
        <summary>Link preparation questions</summary>
        <div className="scroll-list">
          {questions.map((q) => (
            <label className="inline-check" key={q.id}>
              <input
                type="checkbox"
                checked={value.questionIds.includes(q.id)}
                onChange={(e) =>
                  update({
                    ...value,
                    questionIds: e.target.checked
                      ? [...value.questionIds, q.id]
                      : value.questionIds.filter((id) => id !== q.id),
                  })
                }
              />
              {q.text}
            </label>
          ))}
        </div>
      </details>
      <div className="sticky-actions">
        <span className="save-status">{status}</span>
        <button
          className="primary"
          onClick={() =>
            void flush()
              .then(() => toast("Event saved."))
              .catch(() => toast("Could not save. Please retry."))
          }
        >
          Save event
        </button>
      </div>
    </>
  );
}
