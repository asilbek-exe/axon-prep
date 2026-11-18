"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Target,
  MessagesSquare,
  FileText,
  Layers,
  Building2,
  Route,
  Mic,
  Code2,
  ChartNoAxesCombined,
  BookOpen,
  Settings,
  Search,
  ArrowUpRight,
  Menu,
  Command,
} from "lucide-react";
import { StoreProvider, useData, flushAll, useToast } from "@/lib/store";
import { Modal } from "./ui";
import { appPath, questionHref } from "@/lib/paths";
export const navigation = [
  ["Preparation plan", "/dashboard", LayoutDashboard],
  ["Recruiter reference", "/recruiter-reference", Target],
  ["Question Bank", "/questions", MessagesSquare],
  ["My Answers", "/answers", FileText],
  ["Story Bank", "/stories", Layers],
  ["Company Intel", "/company", Building2],
  ["Axon Journey", "/journey", Route],
  ["Mock Interview", "/practice", Mic],
  ["Technical Rounds", "/technical", Code2],
  ["Review & Progress", "/review", ChartNoAxesCombined],
  ["Resources", "/resources", BookOpen],
  ["Settings", "/settings", Settings],
] as const;
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  const path = appPath(usePathname());
  const router = useRouter();
  const { questions, stories, settings } = useData();
  const toast = useToast();
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const compact = path === "/call-mode";
  const results = [
    ...navigation.map(([title, href]) => ({ title, href, type: "Page" })),
    ...questions.map((q) => ({
      title: q.text,
      href: questionHref(q.id),
      type: q.category,
    })),
    ...stories.map((s) => ({
      title: s.title,
      href: `/stories?story=${s.id}`,
      type: "Story",
    })),
  ]
    .filter((x) => x.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 12);
  return (
    <div
      className={compact ? "app compact" : "app"}
      onClickCapture={(e) => {
        const link = (e.target as HTMLElement).closest("a");
        if (
          !link ||
          link.target === "_blank" ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        )
          return;
        const url = new URL(link.href, location.href);
        if (
          url.origin !== location.origin ||
          link.hasAttribute("download") ||
          link.getAttribute("href")?.startsWith("#")
        )
          return;
        e.preventDefault();
        e.stopPropagation();
        void flushAll()
          .then(() => {
            setMobile(false);
            setSearch(false);
            router.push(appPath(url.pathname) + url.search + url.hash);
          })
          .catch(() =>
            toast("A save failed. Stay here and retry saving before leaving."),
          );
      }}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {!compact && (
        <>
          <aside className={`sidebar ${mobile ? "open" : ""}`}>
            <Link className="brand" href="/dashboard">
              <span className="brand-mark">
                A<span />
              </span>
              <span>
                axon<span className="brand-light">prep</span>
                <small>YOUR NEXT CHAPTER</small>
              </span>
            </Link>
            <button className="search-button" onClick={() => setSearch(true)}>
              <Search size={15} />
              <span>Search workspace</span>
              <kbd>⌘ K</kbd>
            </button>
            <nav aria-label="Main navigation">
              {navigation
                .filter(([, href]) =>
                  [
                    "/dashboard",
                    "/answers",
                    "/stories",
                    "/company",
                    "/practice",
                  ].includes(href),
                )
                .map(([title, href, Icon]) => (
                  <Link
                    key={href}
                    className={
                      path === href ||
                      (href === "/dashboard" && path === "/recruiter-prep")
                        ? "active"
                        : ""
                    }
                    href={href}
                  >
                    <Icon size={16} />
                    <span>{title}</span>
                  </Link>
                ))}
            </nav>
            <details
              className="more-navigation"
              open={
                navigation.some(
                  ([, href]) =>
                    ![
                      "/dashboard",
                      "/answers",
                      "/stories",
                      "/company",
                      "/practice",
                      "/settings",
                    ].includes(href) && path.startsWith(href),
                ) || undefined
              }
            >
              <summary>Library & later rounds</summary>
              <nav aria-label="Additional navigation">
                {navigation
                  .filter(
                    ([, href]) =>
                      ![
                        "/dashboard",
                        "/answers",
                        "/stories",
                        "/company",
                        "/practice",
                        "/settings",
                      ].includes(href),
                  )
                  .map(([title, href, Icon]) => (
                    <Link
                      key={href}
                      className={
                        path === href ||
                        (href === "/questions" &&
                          path.startsWith("/questions/"))
                          ? "active"
                          : ""
                      }
                      href={href}
                    >
                      <Icon size={16} />
                      <span>{title}</span>
                    </Link>
                  ))}
              </nav>
            </details>
            <div className="sidebar-bottom minimal-sidebar-bottom">
              <Link href="/settings">
                <Settings size={16} />
                Settings & backups
              </Link>
              <div>
                <span className="minimal-avatar">
                  {settings[0].name.slice(0, 1)}
                </span>
                <span>
                  {settings[0].name}
                  <small>Personal workspace</small>
                </span>
              </div>
            </div>
          </aside>
          {mobile && (
            <button
              className="sidebar-overlay"
              aria-label="Close navigation"
              onClick={() => setMobile(false)}
            />
          )}
          <header className="topbar">
            <div>
              <button
                className="icon-button mobile-menu"
                aria-label="Open navigation"
                onClick={() => setMobile(!mobile)}
              >
                <Menu size={20} />
              </button>
              <span className="muted">Workspace</span>
              <span className="breadcrumb-slash">/</span>
              <span>
                {navigation.find(([, href]) => path.startsWith(href))?.[0] ||
                  "Dashboard"}
              </span>
            </div>
            <div className="topbar-right">
              <span className="local-indicator">
                <i />
                Stored on this device
              </span>
              <Link href="/call-mode">
                Open call mode
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </header>
        </>
      )}
      <main id="main" className="main-content">
        {children}
        <footer className="page-footer">
          Your preparation stays on this device.
          <span>Personal workspace · Not affiliated with Axon</span>
        </footer>
      </main>
      {search && (
        <Modal title="Search your workspace" onClose={() => setSearch(false)}>
          <div className="search-input">
            <Search size={18} />
            <input
              aria-label="Search workspace"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Questions, stories, or pages…"
            />
            <Command size={15} />
          </div>
          <div className="search-results">
            {results.map((r) => (
              <Link href={r.href} key={r.href}>
                <span>
                  {r.title}
                  <small>{r.type}</small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
            ))}
            {!results.length && (
              <p>No results. Try a project name or question topic.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
