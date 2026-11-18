"use client";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, X, Check } from "lucide-react";
import { Question } from "@/lib/models";
import { useData, useToast } from "@/lib/store";
import { db } from "@/lib/db";
import { useEffect, useRef } from "react";
import { questionHref, sitePath } from "@/lib/paths";
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function ActionLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link className={`button ${primary ? "primary" : ""}`} href={href}>
      {children}
      <ArrowUpRight size={15} />
    </Link>
  );
}
export function SectionTitle({
  title,
  link,
  href,
}: {
  title: string;
  link?: string;
  href?: string;
}) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {href && (
        <Link href={href}>
          {link || "View all"}
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function QuestionRow({
  q,
  index,
  preview,
}: {
  q: Question;
  index?: number;
  preview?: string;
}) {
  const { answers, stories } = useData();
  const a = answers.find((a) => a.questionId === q.id);
  return (
    <Link href={questionHref(q.id)} className="question-row">
      <span className="question-number">
        {index !== undefined ? String(index + 1).padStart(2, "0") : "↗"}
      </span>
      <div className="question-main">
        <strong>{q.text}</strong>
        <div className="inline-meta">
          <span>{q.category}</span>
          {a?.starter && <span className="yellow-text">Starter draft</span>}
          {q.linkedStoryIds[0] && (
            <span>
              {stories.find((s) => s.id === q.linkedStoryIds[0])?.title}
            </span>
          )}
        </div>
        {preview && <p className="preview-text">{preview}</p>}
      </div>
      <div className="question-end">
        <Badge tone={q.priority === "Critical" ? "yellow" : "muted"}>
          {q.priority}
        </Badge>
        <span
          className={`status-text ${q.status === "Mastered" ? "green-text" : ""}`}
        >
          {q.status}
        </span>
        {q.confidence > 0 && (
          <span className="muted">{q.confidence}/5 confidence</span>
        )}
      </div>
      <ChevronRight size={16} />
    </Link>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Checklist({
  items,
  prefix,
}: {
  items: string[];
  prefix: string;
}) {
  const { notes } = useData();
  const toast = useToast();
  return (
    <div className="checklist">
      {items.map((item, i) => {
        const id = `${prefix}-${i}`;
        const checked = notes.some((n) => n.id === id && n.value === "true");
        return (
          <label key={id} className={checked ? "checked" : ""}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                void db.notes
                  .put({
                    id,
                    value: String(e.target.checked),
                    updatedAt: new Date().toISOString(),
                  })
                  .catch(() =>
                    toast("Could not save checklist. Please try again."),
                  );
              }}
            />
            <span className="custom-check">
              {checked && <Check size={12} />}
            </span>
            {item}
          </label>
        );
      })}
    </div>
  );
}
export function Confidence({
  value,
  onChange,
  label = "Confidence",
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <div className="confidence">
      <span>{label}</span>
      <div>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label} ${n}`}
            aria-pressed={value === n}
            className={value === n ? "selected" : ""}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <small>1 · weak &nbsp; 5 · confident</small>
    </div>
  );
}
export function SourceLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="source-link"
      href={sitePath(href)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={13} />
    </a>
  );
}
