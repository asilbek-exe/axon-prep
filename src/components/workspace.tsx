"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { AppShell } from "./shell";
import { Dashboard } from "./dashboard";
import { RecruiterPrep, RecruiterReference, CallMode } from "./recruiter";
import { QuestionBank } from "./questions";
import { AnswerEditor } from "./answer-editor";
import { StoryBank } from "./stories";
import { CompanyIntel } from "./company";
import { Journey } from "./journey";
import { Practice } from "./practice";
import { Review } from "./review";
import { Technical } from "./technical";
import { Resources } from "./resources";
import { SettingsPage } from "./settings";
import { Empty, ActionLink } from "./ui";
import { appPath } from "@/lib/paths";
export default function Workspace() {
  const path = appPath(usePathname());
  const params = useSearchParams();
  const query = params.toString();
  let content: React.ReactNode;
  if (path === "/questions/edit")
    content = <AnswerEditor id={params.get("id") || ""} />;
  else if (path.startsWith("/questions/"))
    content = <AnswerEditor id={decodeURIComponent(path.split("/")[2])} />;
  else
    switch (path) {
      case "/":
      case "/dashboard":
        content = <Dashboard />;
        break;
      case "/recruiter-prep":
        content = <RecruiterPrep />;
        break;
      case "/recruiter-reference":
        content = <RecruiterReference />;
        break;
      case "/call-mode":
        content = <CallMode />;
        break;
      case "/questions":
        content = <QuestionBank />;
        break;
      case "/answers":
        content = <QuestionBank answersOnly />;
        break;
      case "/stories":
        content = <StoryBank />;
        break;
      case "/company":
        content = <CompanyIntel />;
        break;
      case "/journey":
        content = <Journey />;
        break;
      case "/practice":
        content = <Practice />;
        break;
      case "/review":
        content = <Review />;
        break;
      case "/technical":
        content = <Technical />;
        break;
      case "/resources":
        content = <Resources />;
        break;
      case "/settings":
        content = <SettingsPage />;
        break;
      default:
        content = (
          <>
            <Empty
              title="Page not found"
              description="Return to your workspace to keep preparing."
            />
            <ActionLink href="/dashboard">Dashboard</ActionLink>
          </>
        );
    }
  return (
    <AppShell>
      <div key={path + "?" + query} className="page-enter">
        {content}
      </div>
    </AppShell>
  );
}
