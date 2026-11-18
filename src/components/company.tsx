"use client";
import { questionHref } from "@/lib/paths";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Download,
  ArrowUpRight,
  Cpu,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { products, values, companySummary, verified } from "@/data/company";
import { talkingPoints } from "@/data/seed";
import { useData, SavedNote } from "@/lib/store";
import { downloadFile } from "@/lib/db";
import { PageHeader, Card, Badge, Modal, SectionTitle, SourceLink } from "./ui";
export function CompanyIntel() {
  const params = useSearchParams();
  const [tab, setTab] = useState(
    params.get("cheat") === "true" ? "Cheat sheet" : "Overview & products",
  );
  const [value, setValue] = useState("");
  const { stories, questions } = useData();
  const selected = values.find((v) => v.name === value);
  return (
    <>
      <PageHeader
        eyebrow="UNDERSTAND THE WORK"
        title="Company intel"
        description="Know the products. Understand the responsibility. Find your connection."
        action={<SourceLink href="https://www.axon.com">Axon.com</SourceLink>}
      />
      <div className="tabs page-tabs">
        {[
          "Overview & products",
          "Seven values",
          "Responsibility",
          "Cheat sheet",
        ].map((t) => (
          <button
            className={tab === t ? "selected" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview & products" && (
        <>
          <Card className="company-mission">
            <div>
              <div className="eyebrow">THE MISSION</div>
              <h2>Protect Life.</h2>
              <p>{companySummary}</p>
              <SourceLink href={products[0].source}>
                Axon announcement · verified {verified}
              </SourceLink>
            </div>
            <div className="ecosystem">
              <span>
                <Radio size={19} />
                Connected devices
              </span>
              <i>↓</i>
              <span>
                <Cpu size={19} />
                Software + intelligence
              </span>
              <i>↓</i>
              <span>
                <ShieldCheck size={19} />
                Evidence + accountability
              </span>
            </div>
          </Card>
          <SectionTitle title="Products, through an engineer’s lens" />
          <div className="product-grid">
            {products.map((p, i) => (
              <Card
                key={p.id}
                className={i === 0 ? "product featured-product" : "product"}
              >
                <div className="product-heading">
                  <span className="product-index">0{i + 1}</span>
                  <Badge tone={i === 0 ? "yellow" : "muted"}>
                    {i === 0 ? "DISCUSSED AT AFROTECH" : p.category}
                  </Badge>
                </div>
                <h2>{p.name}</h2>
                <p>{p.summary}</p>
                <details>
                  <summary>Engineering context + my connection</summary>
                  <p>{p.detail}</p>
                  <p>
                    <strong>Users:</strong> {p.users}
                  </p>
                  <p>
                    <strong>Engineering discussion:</strong> {p.challenge}
                  </p>
                  <div className="connection-note">{p.connection}</div>
                  <SavedNote
                    id={`product-${p.id}`}
                    label="My research notes"
                    rows={3}
                  />
                </details>
                <SourceLink href={p.source}>
                  Official source · {verified}
                </SourceLink>
              </Card>
            ))}
          </div>
          <Card className="news-entry-link">
            <h3>Keep your research current</h3>
            <p>
              Save articles with their source, publication date, and what they
              mean for the interview.
            </p>
            <Link className="button" href="/resources?kind=Article">
              Add a research article
              <ArrowUpRight size={14} />
            </Link>
          </Card>
        </>
      )}
      {tab === "Seven values" && (
        <>
          <p className="muted">
            Use the values to choose real stories, not slogans. Own It is the
            connection you already made with Nache.
          </p>
          <div className="values-grid">
            {values.map((v, i) => (
              <button
                key={v.name}
                className={`value-card ${v.name === "Own It" ? "featured-value" : ""}`}
                onClick={() => setValue(v.name)}
              >
                <span className="eyebrow">0{i + 1}</span>
                <h2>
                  {v.name}
                  <ArrowUpRight size={18} />
                </h2>
                <p>{v.meaning}</p>
                <small>
                  {
                    stories.filter(
                      (s) => !s.archived && s.valueIds.includes(v.name),
                    ).length
                  }{" "}
                  linked stories
                </small>
              </button>
            ))}
          </div>
          <SourceLink href="https://www.axon.com/resources/values">
            Axon’s seven values · verified {verified}
          </SourceLink>
        </>
      )}
      {tab === "Responsibility" && (
        <>
          <Card>
            <h2>Useful technology carries real responsibility.</h2>
            <p>
              Public safety tools affect people beyond their direct users. In an
              interview, explain both the intended benefit and how you would
              investigate a failure or unintended effect.
            </p>
            <SourceLink href={products[0].source}>
              Axon’s stated approach to responsible innovation
            </SourceLink>
          </Card>
          <div className="grid-three">
            {[
              [
                "Reliability",
                "What happens when a device loses connectivity? How do users know a system is unavailable? Consider fallback paths, testing, and operational visibility.",
              ],
              [
                "Privacy + accountability",
                "Which information is necessary? Who can access it, for what purpose, and for how long? Consider permission boundaries and auditable access.",
              ],
              [
                "Human oversight",
                "Can a reviewer inspect the underlying evidence, correct an AI-generated draft, and reject unsupported information? Make uncertainty visible.",
              ],
            ].map(([title, body]) => (
              <Card key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
                <Badge>Engineering discussion prompt</Badge>
              </Card>
            ))}
          </div>
          <Card>
            <h3>Your research connection</h3>
            <p>
              Use eBPF monitoring and cgroup containment to explain why
              observing and bounding system behavior matters. Be explicit about
              the limited test set. These are your engineering connections, not
              claims about Axon’s internal implementation.
            </p>
            <SavedNote
              id="responsible-ai"
              label="My position and questions"
              placeholder="What tradeoff would you want to understand before building or shipping a feature?"
            />
          </Card>
        </>
      )}
      {tab === "Cheat sheet" && <CheatSheet />}
      {selected && (
        <Modal title={selected.name} onClose={() => setValue("")}>
          <p>{selected.meaning}</p>
          <div className="connection-note">{selected.connection}</div>
          <h3>My stories</h3>
          {stories
            .filter((s) => !s.archived && s.valueIds.includes(selected.name))
            .map((s) => (
              <p key={s.id}>
                <Link href={`/stories?story=${s.id}`}>{s.title} ↗</Link>
              </p>
            ))}
          <h3>Questions to practice</h3>
          {questions
            .filter(
              (q) =>
                q.category === "Axon values" &&
                (q.linkedStoryIds.some((id) =>
                  stories.some(
                    (s) => s.id === id && s.valueIds.includes(selected.name),
                  ),
                ) ||
                  !selected.story),
            )
            .slice(0, 5)
            .map((q) => (
              <p key={q.id}>
                <Link href={questionHref(q.id)}>{q.text} ↗</Link>
              </p>
            ))}
          <SavedNote
            key={selected.name}
            id={`value-${selected.name}`}
            label="My personal notes"
            placeholder="A concrete example, decision, and lesson…"
          />
          <SourceLink href="https://www.axon.com/resources/values">
            Official values
          </SourceLink>
        </Modal>
      )}
    </>
  );
}
function CheatSheet() {
  const { notes } = useData();
  const chosen = notes
    .filter((n) => n.id.startsWith("pick-") && n.value === "true")
    .map(
      (n) =>
        notes.find((a) => a.id === n.id.replace("pick-", "ask-"))?.value || "",
    );
  const text = `# Axon interview cheat sheet\n\n${companySummary}\n\n## Products\n${products.map((p) => `- ${p.name}: ${p.summary} Source: ${p.source}`).join("\n")}\n\n## Values\n${values.map((v) => `- ${v.name}: ${v.meaning}`).join("\n")}\n\n## My connections\n${talkingPoints.map((t) => "- " + t).join("\n")}\n\n## Two observations\n- Connected products make reliability across device and cloud boundaries an interesting engineering problem.\n- Draft One requires human review, making verification and accountability part of the workflow.\n\n## Questions\n${chosen.map((t) => "- " + t).join("\n")}`;
  return (
    <>
      <div className="actions no-print">
        <button onClick={() => window.print()}>
          <Printer size={16} />
          Print cheat sheet
        </button>
        <button
          onClick={() =>
            downloadFile("axon-cheat-sheet.md", text, "text/markdown")
          }
        >
          <Download size={16} />
          Export Markdown
        </button>
      </div>
      <Card className="cheat-sheet">
        <div className="eyebrow">
          PERSONAL INTERVIEW REFERENCE · VERIFIED NOV 17, 2026
        </div>
        <h1>Axon, at a glance.</h1>
        <p>{companySummary}</p>
        <div className="cheat-columns">
          <div>
            <h3>Connected products</h3>
            {products.map((p) => (
              <p key={p.id}>
                <strong>{p.name}</strong> · {p.summary}
                <a
                  href={p.source}
                  className="cheat-source"
                  target="_blank"
                  rel="noreferrer"
                >
                  {" "}
                  Source ↗
                </a>
              </p>
            ))}
            <h3>Two useful observations</h3>
            <p>
              Device-to-cloud reliability connects with my ShakeUR and
              networking experience. This is my engineering observation.
            </p>
            <p>
              Draft One’s required human review makes verification and
              accountability part of the workflow.
            </p>
          </div>
          <div>
            <h3>Seven values</h3>
            <p>{values.map((v) => v.name).join(" · ")}</p>
            <h3>Why I’m interested</h3>
            <p>
              Backend systems, intelligent devices, and security. At AfroTech, I
              heard how closely Axon’s hardware and software teams collaborate.
            </p>
            <h3>My strongest connections</h3>
            <ul>
              {talkingPoints.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <h3>Questions to ask</h3>
            {chosen.length ? (
              chosen.map((t) => <p key={t}>{t}</p>)
            ) : (
              <p>
                How are interns matched to teams? What is the timeline for the
                next stage?
              </p>
            )}
            <p className="small">
              Sources: official product links; axon.com/resources/values.
              Personal facts: supplied resume and meeting recap.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
