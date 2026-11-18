"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Code2, Users, Sparkles } from "lucide-react";
import { exercises, technicalChecklist, values } from "@/data/company";
import { SavedNote, useData } from "@/lib/store";
import {
  PageHeader,
  Card,
  Badge,
  Checklist,
  SectionTitle,
  SourceLink,
} from "./ui";
export function Technical() {
  const [tab, setTab] = useState("Engineering with AI");
  const { stories } = useData();
  return (
    <>
      <PageHeader
        eyebrow="BUILD ON YOUR MOMENTUM"
        title="Technical rounds"
        description="The confirmed interview format, with a practical place to prepare."
      />
      <div className="notice">
        Source: your Axon Software Engineer Intern Interview Guide. It describes
        Engineering with AI, then a panel containing Coding and ACE Behavioral.
        The recruiter email names the three components separately.
      </div>
      <div className="tabs page-tabs">
        {["Engineering with AI", "Traditional Coding", "ACE Behavioral"].map(
          (t) => (
            <button
              key={t}
              className={tab === t ? "selected" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ),
        )}
      </div>
      {tab === "Engineering with AI" && (
        <>
          <Card className="round-overview">
            <Sparkles size={28} />
            <div>
              <Badge tone="yellow">90 MINUTES · CODILITY · AI REQUIRED</Badge>
              <h2>Lead the engineering. Use AI deliberately.</h2>
              <p>
                You will receive a system to build. Clarify requirements, use
                AI, inspect its output, test and debug, and improve the
                solution. The guide emphasizes judgment and iteration, not just
                a finished product.
              </p>
            </div>
          </Card>
          <div className="two-column">
            <Card>
              <h3>What is evaluated</h3>
              <ul className="point-list">
                <li>Requirements clarification and intentional AI use.</li>
                <li>Understanding and reviewing generated code.</li>
                <li>Correctness, testing, debugging, and refinement.</li>
                <li>Communicating assumptions and tradeoffs.</li>
              </ul>
              <SavedNote
                id="ai-round-reflection"
                label="My preparation notes"
              />
            </Card>
            <Card>
              <h3>Preparation checklist</h3>
              <Checklist items={technicalChecklist} prefix="ai-check" />
            </Card>
          </div>
          <SectionTitle title="Five systems to practice building" />
          <p className="small muted">
            Original preparation exercises. These are not actual or leaked Axon
            questions. Use your own editor and AI assistant; this workspace
            stores your plan and reflection.
          </p>
          {exercises.map((e, i) => (
            <Card key={e.title}>
              <div className="section-title">
                <h2>
                  0{i + 1} · {e.title}
                </h2>
                <Badge>Mock exercise</Badge>
              </div>
              <p>{e.brief}</p>
              <p>
                <strong>Edge cases to investigate:</strong> {e.edge}
              </p>
              <details>
                <summary>Open exercise workbook</summary>
                <div className="form-grid">
                  {[
                    "Requirements and clarifying questions",
                    "Assumptions",
                    "Architecture and tradeoffs",
                    "Edge cases and tests",
                    "AI prompts and output review",
                    "Bugs found and fixes",
                    "Improvements and reflection",
                  ].map((label, j) => (
                    <SavedNote
                      key={label}
                      id={`exercise-${i}-${j}`}
                      label={label}
                      rows={4}
                    />
                  ))}
                </div>
              </details>
            </Card>
          ))}
        </>
      )}
      {tab === "Traditional Coding" && (
        <>
          <Card className="round-overview">
            <Code2 size={28} />
            <div>
              <Badge tone="blue">60 MINUTES · CODILITY</Badge>
              <h2>Explain the approach before the implementation.</h2>
              <p>
                Backend fundamentals and problem solving. The guide lists
                introductions, expectations, a 45–50 minute exercise, and
                discussion. Its preparation plan suggests clarifying first,
                implementing the core, testing edge cases, and closing with
                complexity and tradeoffs; adapt timing with the interviewer.
              </p>
            </div>
          </Card>
          <div className="two-column">
            <Card>
              <h3>Communication + correctness</h3>
              <Checklist
                items={[
                  "Confirm inputs, outputs, constraints, and examples",
                  "Outline a plan before coding",
                  "Explain the data structure choice",
                  "Narrate decisions and changes",
                  "Summarize the result and limitations",
                ]}
                prefix="coding-communication"
              />
              <h3>Complexity</h3>
              <Checklist
                items={[
                  "Define n and other input sizes",
                  "Analyze time complexity",
                  "Analyze auxiliary space",
                  "Discuss an alternative and its tradeoffs",
                ]}
                prefix="coding-complexity"
              />
            </Card>
            <Card>
              <h3>Testing</h3>
              <Checklist
                items={[
                  "Happy path and representative examples",
                  "Empty input and single item",
                  "Duplicates and boundary values",
                  "Invalid input and error handling",
                  "Large inputs and performance",
                ]}
                prefix="coding-tests"
              />
              <SavedNote
                id="coding-strengths"
                label="Strengths and weaknesses"
                placeholder="Which patterns or explanations need work?"
              />
            </Card>
          </div>
          <Card>
            <h3>Keep a problem log</h3>
            <p>
              Save links, approaches, complexity, and lessons learned in
              Resources.
            </p>
            <Link
              className="button primary"
              href="/resources?kind=Coding%20problem"
            >
              Add a coding problem
              <ArrowUpRight size={15} />
            </Link>
          </Card>
        </>
      )}
      {tab === "ACE Behavioral" && (
        <>
          <Card className="round-overview">
            <Users size={28} />
            <div>
              <Badge tone="green">60 MINUTES · VALUES + BEHAVIOR</Badge>
              <h2>Four to six stories you can adapt.</h2>
              <p>
                The guide emphasizes collaboration, accountability, integrity,
                resilience, communication, learning, and motivation. Build
                specific STAR stories, then practice adapting them to the
                question asked.
              </p>
              <Link className="button primary" href="/stories">
                Open Story Bank
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </Card>
          <div className="grid-three">
            {values.map((v) => {
              const prepared = stories.filter(
                (s) =>
                  !s.archived &&
                  s.valueIds.includes(v.name) &&
                  s.situation.trim() &&
                  s.task.trim() &&
                  s.action.trim() &&
                  s.result.trim() &&
                  s.reflection.trim(),
              );
              return (
                <Card key={v.name}>
                  <h3>{v.name}</h3>
                  <Badge tone={prepared.length ? "green" : "yellow"}>
                    {prepared.length
                      ? `${prepared.length} complete STAR stories`
                      : "Needs a completed example"}
                  </Badge>
                  <p>{v.connection}</p>
                  <Link href="/stories">Prepare a story ↗</Link>
                </Card>
              );
            })}
          </div>
          <SavedNote
            id="behavioral-reflection"
            label="What I want my stories to show"
          />
        </>
      )}
      <div className="resource-footnote">
        <SourceLink href="/documents/axon-interview-guide.pdf">
          Open the supplied interview guide
        </SourceLink>
        <p>
          Interview-guide instructions are preparation material, not application
          behavior or authorization to use AI in other rounds. The guide
          explicitly requires AI only in Engineering with AI.
        </p>
      </div>
    </>
  );
}
