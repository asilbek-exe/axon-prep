"use client";
import Link from "next/link";
import { PreparationGuide } from "./preparation-guide";
export function RecruiterPrep() {
  return <PreparationGuide />;
}
import {
  CalendarDays,
  Clock3,
  ArrowUpRight,
  Focus,
  ArrowLeft,
} from "lucide-react";
import { useData, SavedNote, useToast } from "@/lib/store";
import { db } from "@/lib/db";
import { topIds, talkingPoints, askNicholas, checklist } from "@/data/seed";
import { companySummary } from "@/data/company";
import { formatDate, interviewTime } from "@/lib/logic";
import {
  PageHeader,
  Card,
  Badge,
  QuestionRow,
  SectionTitle,
  Checklist,
  ActionLink,
} from "./ui";
export function RecruiterReference() {
  const { questions, events, notes } = useData();
  const event = events.find((e) => e.id === "recruiter");
  const toast = useToast();
  const picked = notes.filter(
    (n) => n.id.startsWith("pick-") && n.value === "true",
  );
  return (
    <>
      <PageHeader
        eyebrow="THE NEXT CONVERSATION"
        title="Recruiter prep"
        description="Fifteen minutes. A clear introduction. A few stories that stick."
        action={
          <ActionLink href="/call-mode">
            <Focus size={16} />
            Open call mode
          </ActionLink>
        }
      />
      <Card className="recruiter-overview">
        <div>
          <Badge tone="yellow">YOUR IMMEDIATE FOCUS</Badge>
          <h2>{event?.interviewer || "Nicholas Cortez, Recruiter II"}</h2>
          <p>
            2027 US Software Engineering Internship · Virtual recruiter screen
          </p>
          <div className="inline-meta">
            <span>
              <CalendarDays size={14} />
              {event ? formatDate(event.date) : "Schedule in Journey"}
            </span>
            <span>
              <Clock3 size={14} />
              {event
                ? new Intl.DateTimeFormat("en-US", {
                    timeZone: "America/New_York",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "short",
                  }).format(interviewTime(event))
                : ""}{" "}
              · {event?.duration || 15} minutes
            </span>
          </div>
        </div>
        <div className="context-block">
          <span className="eyebrow">YOU HAVE ALREADY CONNECTED</span>
          <p>
            Your November 3 conversation with Nache introduced your experience
            and interest in hardware/software collaboration.
          </p>
          <Link href="/journey">
            Review my Axon meeting
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </Card>
      <div className="notice">
        These are likely recruiter themes, based on your invitation and common
        screen formats. They are preparation prompts, not a confirmed interview
        script.
      </div>
      <div className="two-column">
        <div>
          <SectionTitle title="The 12 answers to know" />
          <Card className="question-list">
            {topIds.map((id, i) => {
              const q = questions.find((q) => q.id === id);
              return q ? <QuestionRow q={q} key={id} index={i} /> : null;
            })}
          </Card>
          <SectionTitle title="Private logistics preparation" />
          <Card>
            <p>
              Prepare accurate availability, location, and work-authorization
              wording. No authorization or sponsorship outcome is assumed.
            </p>
            <ActionLink href="/questions/authorization">
              Prepare work authorization response
            </ActionLink>
            <p className="small muted">
              You supplied that you are an F-1 student. Confirm the details with
              your university’s international student office and applicable
              authorities.
            </p>
          </Card>
          <SectionTitle title="How to reference my AfroTech meeting" />
          <Card>
            <p className="quoted">
              “I had the chance to meet Nache Shekarri at AfroTech earlier this
              month. We talked about Axon’s body cameras and how closely
              hardware and software teams work together. That connected with my
              Raspberry Pi project at HackPrinceton.”
            </p>
            <p className="small muted">
              Suggested wording. Keep it natural. A personal recommendation has
              not been confirmed.
            </p>
            <ActionLink href="/questions/afrotech">
              Make this answer yours
            </ActionLink>
          </Card>
        </div>
        <div>
          <SectionTitle title="Your essential talking points" />
          <Card>
            <ul className="point-list">
              {talkingPoints.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Card>
          <SectionTitle title="Day-of checklist" />
          <Card>
            <Checklist items={checklist} prefix="dayof" />
          </Card>
          <SectionTitle title="Questions for Nicholas" />
          <Card>
            <p>Pick your top two or three. Leave room for the conversation.</p>
            <Badge tone="yellow">{picked.length} selected</Badge>
            <div className="ask-list">
              {askNicholas.map((_, i) => {
                const id = `pick-${i}`;
                return (
                  <div key={i}>
                    <label className="pick-question">
                      <input
                        type="checkbox"
                        aria-label={`Select recruiter question ${i + 1}`}
                        checked={notes.some(
                          (n) => n.id === id && n.value === "true",
                        )}
                        onChange={(e) => {
                          if (e.target.checked && picked.length >= 3) {
                            toast(
                              "Keep this list focused: select at most three questions.",
                            );
                            return;
                          }
                          void db.notes
                            .put({
                              id,
                              value: String(e.target.checked),
                              updatedAt: new Date().toISOString(),
                            })
                            .catch(() => toast("Could not save selection."));
                        }}
                      />
                      Question {i + 1}
                    </label>
                    <SavedNote
                      id={`ask-${i}`}
                      label={`Edit question ${i + 1}`}
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
export function CallMode() {
  const { notes, answers } = useData();
  const selected = notes.filter(
    (n) => n.id.startsWith("pick-") && n.value === "true",
  );
  return (
    <>
      <div className="call-heading">
        <Link href="/recruiter-prep" className="quiet-link">
          <ArrowLeft size={16} />
          Back to preparation
        </Link>
        <Badge tone="yellow">CALL REFERENCE · NO RECORDING</Badge>
      </div>
      <PageHeader
        eyebrow="KEEP IT SIMPLE. BE YOURSELF."
        title="A few notes. Your own voice."
        description="Pause. Listen to the question. Lead with the point."
      />
      <div className="two-column">
        <Card>
          <h2>Your talking points</h2>
          <ul className="point-list large-points">
            {talkingPoints.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h3>Quick introduction</h3>
          <p className="preserve-lines">
            {answers.find((a) => a.questionId === "intro")?.quick ||
              "Your 15-second answer will appear here. Edit it in the introduction answer editor."}
          </p>
        </Card>
        <Card>
          <h2>Your questions</h2>
          {selected.length ? (
            <ol className="point-list">
              {selected.map((n) => (
                <li key={n.id}>
                  {
                    notes.find((a) => a.id === n.id.replace("pick-", "ask-"))
                      ?.value
                  }
                </li>
              ))}
            </ol>
          ) : (
            <p>Select two questions in Recruiter Prep before the call.</p>
          )}
          <h3>Company in a few words</h3>
          <p>{companySummary}</p>
          <SavedNote
            id="call-personal"
            label="Personal notes"
            rows={6}
            placeholder="Names, reminders, and points to return to…"
          />
        </Card>
      </div>
    </>
  );
}
