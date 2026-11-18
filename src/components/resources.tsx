"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, FileText, Trash2 } from "lucide-react";
import { useData, useToast } from "@/lib/store";
import { db } from "@/lib/db";
import { Resource, resourceSchema } from "@/lib/models";
import { products } from "@/data/company";
import {
  PageHeader,
  Card,
  Badge,
  Modal,
  SourceLink,
  Empty,
  SectionTitle,
} from "./ui";
export function Resources() {
  const { resources } = useData();
  const params = useSearchParams();
  const toast = useToast();
  const [editing, setEditing] = useState<Resource | null>(null);
  const [filter, setFilter] = useState(params.get("kind") || "All");
  const [error, setError] = useState("");
  function add() {
    setError("");
    setEditing({
      id: crypto.randomUUID(),
      title: "",
      url: "",
      kind:
        filter === "Article" || filter === "Coding problem"
          ? filter
          : "Resource",
      date: "",
      summary: "",
      why: "",
      notes: "",
      completed: false,
    });
  }
  return (
    <>
      <PageHeader
        eyebrow="YOUR REFERENCE SHELF"
        title="Resources"
        description="Source documents, useful links, and the research you choose to keep."
        action={
          <button className="primary" onClick={add}>
            <Plus size={16} />
            Save a resource
          </button>
        }
      />
      <div className="grid-three">
        {[
          [
            "Your resume",
            "Your supplied experience and project details.",
            "/documents/asilbek-resume.pdf",
          ],
          [
            "Axon interview guide",
            "The confirmed Engineering with AI, Coding, and ACE formats.",
            "/documents/axon-interview-guide.pdf",
          ],
          [
            "ShakeUR on Devpost",
            "Project description, team contributions, and awards.",
            "https://devpost.com/software/shakeur",
          ],
        ].map(([title, body, url]) => (
          <Card key={title}>
            <FileText size={23} />
            <h2>{title}</h2>
            <p>{body}</p>
            <SourceLink href={url}>Open resource</SourceLink>
          </Card>
        ))}
      </div>
      <SectionTitle title="Official company sources" />
      <Card>
        <div className="source-list">
          {[
            ...products.map((p) => [p.name, p.source]),
            ["Seven values", "https://www.axon.com/resources/values"],
          ].map(([title, url]) => (
            <SourceLink href={url} key={url}>
              {title}
            </SourceLink>
          ))}
        </div>
      </Card>
      <SectionTitle title="My saved resources" />
      <div className="tabs page-tabs">
        {["All", "Article", "Coding problem", "Resource"].map((t) => (
          <button
            className={filter === t ? "selected" : ""}
            key={t}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid-two">
        {resources
          .filter((r) => filter === "All" || r.kind === filter)
          .map((r) => (
            <Card key={r.id}>
              <Badge>
                {r.kind}
                {r.completed ? " · Completed" : ""}
              </Badge>
              <h2>{r.title}</h2>
              <p className="small muted">{r.date || "Date not supplied"}</p>
              <p>{r.summary}</p>
              {r.why && (
                <p>
                  <strong>Why it matters:</strong> {r.why}
                </p>
              )}
              <p className="preserve-lines">{r.notes}</p>
              <div className="actions">
                <SourceLink href={r.url}>Source</SourceLink>
                <button
                  onClick={() => {
                    setEditing(r);
                    setError("");
                  }}
                >
                  Edit notes
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete ${r.title}`}
                  onClick={async () => {
                    if (confirm("Delete this saved resource?")) {
                      try {
                        await db.resources.delete(r.id);
                      } catch {
                        toast("Could not delete resource.");
                      }
                    }
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
      </div>
      {!resources.filter((r) => filter === "All" || r.kind === filter)
        .length && (
        <Empty
          title="Keep the links that matter"
          description="Save an article or coding problem with a note about why it is useful. No live headlines are generated."
        />
      )}
      {editing && (
        <Modal title="Save a resource" onClose={() => setEditing(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const parsed = resourceSchema.safeParse(editing);
              if (!parsed.success) {
                setError(parsed.error.issues.map((i) => i.message).join(" "));
                return;
              }
              try {
                await db.resources.put(parsed.data);
                setEditing(null);
                toast("Resource saved.");
              } catch {
                setError("Could not save. Please retry.");
              }
            }}
          >
            <label className="field">
              Title
              <input
                required
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </label>
            <label className="field">
              Source URL
              <input
                type="url"
                required
                value={editing.url}
                onChange={(e) =>
                  setEditing({ ...editing, url: e.target.value })
                }
                placeholder="https://…"
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Type
                <select
                  value={editing.kind}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      kind: e.target.value as Resource["kind"],
                    })
                  }
                >
                  {["Article", "Coding problem", "Resource"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Publication / practice date
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) =>
                    setEditing({ ...editing, date: e.target.value })
                  }
                />
              </label>
            </div>
            {(["summary", "why", "notes"] as const).map((f, i) => (
              <label className="field" key={f}>
                {
                  [
                    "Summary / approach",
                    "Why it matters for the interview",
                    "Personal notes / complexity / lessons",
                  ][i]
                }
                <textarea
                  rows={3}
                  value={editing[f]}
                  onChange={(e) =>
                    setEditing({ ...editing, [f]: e.target.value })
                  }
                />
              </label>
            ))}
            <label className="inline-check">
              <input
                type="checkbox"
                checked={editing.completed}
                onChange={(e) =>
                  setEditing({ ...editing, completed: e.target.checked })
                }
              />
              Reviewed / practiced
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary" type="submit">
              Save resource
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
