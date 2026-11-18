import { Suspense } from "react";
import Workspace from "@/components/workspace";
import { seedQuestions } from "@/data/seed";

export const dynamicParams = false;

export function generateStaticParams() {
  const pages = [
    "dashboard",
    "recruiter-prep",
    "recruiter-reference",
    "call-mode",
    "questions",
    "answers",
    "stories",
    "company",
    "journey",
    "practice",
    "review",
    "technical",
    "resources",
    "settings",
  ];
  return [
    { path: [] },
    ...pages.map((page) => ({ path: [page] })),
    { path: ["questions", "edit"] },
    ...seedQuestions.map((question) => ({ path: ["questions", question.id] })),
  ];
}

export default function Page() {
  return (
    <Suspense fallback={<div className="loading">Opening your workspace…</div>}>
      <Workspace />
    </Suspense>
  );
}
