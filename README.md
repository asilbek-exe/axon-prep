# Axon Interview Command Center

A browser-local interview preparation workspace for Asilbek Ismatilloev’s 2027 Axon SWE internship process. Built with Next.js App Router, React, TypeScript, Tailwind CSS, Lucide, Dexie/IndexedDB, and Zod.

## Run locally

Use **Node.js 22.13+ (Node 24 recommended)** and npm.

```bash
npm ci
npm run dev
```

Open **http://127.0.0.1:3000/dashboard**. Use the same hostname, port, and browser every time; browser storage is scoped to that origin.

For a static production build:

```bash
npm run build
python3 -m http.server 3001 --bind 127.0.0.1 --directory out
```

The production build uses Next’s supported webpack builder and outputs static files in `out/`. Local static preview uses Python 3; `npm start` serves `out/` on port 3000. Turbopack development works; its production CSS worker could not bind a port in the task environment, so the production script uses webpack. No API keys, accounts, or cloud database are required. The optional build-time `NEXT_PUBLIC_BASE_PATH` sets a hosting subdirectory. Next.js development/build telemetry is disabled by the npm scripts.

## GitHub Pages

Published from `main` at **https://asilbek-exe.github.io/axon-prep/**. The workflow in `.github/workflows/pages.yml` installs Node 24, checks lint and unit tests, exports the app, and deploys `out/` using GitHub Actions. Repository **Settings → Pages → Source** must be **GitHub Actions**. Future pushes to `main` redeploy automatically.

Next exports all main routes and seeded question deep links at build time. New or imported custom questions use `/questions/edit/?id=…`, so a browser-created ID does not require a server route. Internal navigation and PDF URLs support the `/axon-prep` project path.

To reproduce the Pages build locally:

```bash
NEXT_PUBLIC_BASE_PATH=/axon-prep npm run build
mkdir -p .pages-preview
ln -s ../out .pages-preview/axon-prep
python3 -m http.server 3001 --bind 127.0.0.1 --directory .pages-preview
# In another terminal:
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 PLAYWRIGHT_APP_PATH=/axon-prep npm run test:e2e
```

When moving from localhost to GitHub Pages, export a JSON backup in the original browser workspace and import it on the published site. Browser storage does not transfer between origins automatically. Publishing deploys the app and starter content, not your saved browser answers.

## What is implemented

- **Preparation plan:** a minimal white home screen with six sequential steps for the 15-minute recruiter call: introduction, motivation, two project stories, logistics, questions, and rehearsal. One step expands at a time, with time estimates, saved completion, and direct links to answers. The interview details use the saved event date; the suggested call flow is explicitly an estimate.
- **Recruiter reference:** the top 12 questions, private logistics preparation, editable questions for Nicholas, persistent top-three selection, a day-of checklist, and a quiet call-reference screen. The larger library and later-round tools sit in a collapsible secondary menu.
- **132 seeded questions:** search, category/round/priority/status/tag filters, sorting, favorites, review flags, custom question creation/deletion, editing, confidence, and story links.
- **Answer editor:** independent draft, polished, 15/30/60-second, bullet, and STAR variants; autosave; manual save; word count and speaking-time estimates; copy; version comparison and restoration; contextual guidance; practice history.
- **Story Bank:** six factual starting templates, editable STAR fields, technologies, skills, values, confidence, many-to-many question links, duplication, and reversible archiving.
- **Company Intel:** sourced overview and eight product cards, Body 5 context, seven values with story connections, personal research notes, responsible-engineering discussion prompts, and a printable/exportable cheat sheet.
- **Axon Journey:** supplied recruiting timeline, the editable AfroTech meeting recap, new events, dates/times, completion state, linked preparation, before/after notes, feedback, and follow-up actions.
- **Mock interviews:** six practice modes, configurable question selection, wall-clock timers, start/pause/reset, hidden prepared notes, skip, written or spoken practice, six self-ratings, feedback, durable attempts, resumable current session, and history with prior-confidence comparisons. No microphone is accessed.
- **Review:** confidence-based scheduling, due/weak/unanswered/improved/mastered queues, active recall, and review history. Recall scratch notes are explicitly temporary; use Mock Interview for saved attempts.
- **Technical rounds:** confirmed round descriptions, saved checklists, five original backend-system exercise workbooks, coding-problem logging, and ACE story coverage.
- **Resources:** the supplied resume and interview guide, official source links, and editable saved articles/coding problems with dates and notes.
- **Settings:** speaking speed, display name, light/dark themes, persistent-storage request, full JSON backup, validated merge/replace import, and selected-answer Markdown export.
- **Global search:** Cmd/Ctrl+K searches pages, questions, and stories. Responsive navigation, keyboard focus states, reduced-motion support, and native accessible dialogs.

## Data, saving, and backups

All structured records live in **IndexedDB**, in database **`axon-prep-v1`**. No browser-entered answer, practice attempt, or note is uploaded to a server. External resource links open only when clicked. The personal starter content and supplied PDFs are included in the published website and repository; they are visible to visitors. Each visitor has a separate browser-local workspace.

The first load seeds the database in one transaction. Subsequent loads do not reseed or overwrite edits. Browser refreshes and normal restarts preserve committed records.

The minimalist redesign switches existing workspaces to the white theme once, preserving answers and notes. Later explicit theme choices are respected. Preparation-step completion is stored with notes and included in JSON backups.

Editors autosave after **350 ms**. Blur, internal links, and manual saves flush queued writes. A visible save indicator reports success only after the database write finishes; failed saves retain the in-memory edit for retry. Closing/reloading with pending changes triggers the browser’s unsaved-change guard. Wait for **Saved** before deliberately closing the browser. Browser/process crashes before a pending write commits cannot be guaranteed recoverable.

Automatic answer checkpoints preserve the preceding state at most once per 30 seconds; manual saves create named checkpoints of the current answer. Up to 30 checkpoints are kept per answer during ordinary saves. Restoring a version preserves the current answer before replacing all variants.

To back up:

1. Open **Settings → Export all data**.
2. Keep the downloaded JSON file in a trusted location.
3. To move devices or restore, open Settings in the destination browser and choose that file.
4. Review the counts and choose **Merge** or **Replace**, then confirm.

Imports validate schema version, unique IDs, safe resource URLs, and cross-record references before writing. All changes happen in one transaction. A failed replacement rolls back. **Merge uses imported records for matching IDs**, even if local records are newer. Replace removes the current workspace and restores the backup. Export first if you want to keep the current state. Import is limited to 25 MB.

Browser data and backups are **not encrypted**. Clearing site data, using a private browsing window, changing the origin, or using a different browser can remove or separate your workspace. This is not cloud sync. A persistent-storage request may reduce browser eviction but is not a substitute for backups. Concurrent editing of the same answer in multiple tabs is not conflict-resolved; use one editing tab.

## How progress is calculated

Starter drafts are labeled and do not count as personal answers. Edit one or choose **Use as my draft** to adopt it. A question is answered when any answer variant contains personal text.

The home screen shows manually completed preparation steps, not a readiness score. The underlying recruiter-readiness calculation averages the top 12 questions. Each question can earn:

- 40% for a personal answer;
- 30% for Ready to Practice, Confident, or Mastered status;
- 30% for at least one saved practice attempt.

This is preparation coverage, not a hiring prediction. Overall answer completion is personal answered questions divided by total questions. Mastery is explicitly selected by you. Completed-session counts exclude unfinished sessions.

Confidence ratings schedule reviews at **4 hours / 1 day / 3 days / 7 days / 14 days** for ratings 1–5. Weak ratings flag a question for improvement. Practice updates the same confidence schedule. Recommendations use transparent rules for missing personal answers, unpracticed answers, long introductions, weak confidence, missing candor stories, and the recruiter interview’s timing.

Dates entered in Journey are interpreted in **America/New_York**, with daylight-saving offsets calculated using `Intl`. The seeded call is November 18, 2026, 11:30–11:45 AM EST, equivalent to 16:30–16:45 UTC.

## Content and provenance

- Your pasted request supplies the meeting details, recruiting timeline, personal background, and preferences.
- `public/documents/axon-interview-guide.pdf` contains the supplied seven-page guide. Its interview guidance is reference content, not application instructions. AI usage is explicitly required for Engineering with AI; no assumption is made about permission in the other rounds.
- `public/documents/asilbek-resume.pdf` contains your supplied resume.
- `src/data/company.ts` stores concise product summaries with official URLs and verification date **2026-11-17**. Engineering connections are labeled as observations, not claims about Axon’s internal architecture.
- `src/data/seed.ts` contains the eight suggested starter drafts, six story candidates, recruiter checklist, and timeline. `src/data/questions.json` holds the remaining topic questions.
- Missing personal incidents stay blank. No conflicts, feedback, authorization outcomes, or additional accomplishments are fabricated. The research’s 100% result is limited to its manually constructed test set. The AfroTech meeting is not represented as a confirmed personal recommendation.

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Browser tests require a running app and Playwright Chromium:

```bash
npx playwright install chromium
npm run dev
# In another terminal:
npm run test:e2e
```

Set `PLAYWRIGHT_BASE_URL` to test another local port. If Chromium is already installed elsewhere, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path.

The 17 Vitest checks cover seed integrity, idempotent initialization, saving/reopening, variants, checkpoints, full backup restoration, rejection of malformed backups, transactional rollback, merge behavior, New York summer/winter offsets, past events, review intervals, readiness, recommendations, word counts, and theme migration without answer loss, and static hosting URL handling.

The eight Playwright workflows cover answer/save/refresh/practice/export/clean-import; filtering/custom questions/story linking/recall/invalid imports; all routes and mobile editing; story persistence/checklists/call mode/reflections/version restoration; timers/global search/resources/printing; desktop/mobile screenshots; guide completion, question selection, notes, and collapsed navigation across reloads; and static entry points, question deep links, and PDF URLs. Custom questions are also reloaded to verify their static editor route. Browser errors are monitored in the main workflow and route smoke checks. Screenshots are in `docs/`; transient traces and the print-check PDF are in ignored `test-results/`.

At implementation, `npm audit --omit=dev` reported **zero production vulnerabilities**. The full development tree still reports a picomatch ReDoS advisory through build/lint/test tools; the registry’s latest release was 4.0.7 and no patched version was available. No arbitrary user-supplied glob patterns are accepted by the app. Recheck the development audit when upgrading tooling.

## Deliberately deferred

Live AI coaching, speech recognition/audio recording, PWA installation, service-worker offline caching, and advanced analytics are not implemented. The app needs a static web server (locally or GitHub Pages) to load pages, but does not require an AI provider for preparation. No fake AI scores or disabled controls stand in for those features. Browser textareas support plain text and Markdown notation; they do not render rich text.

## Structure

```text
src/app/          Next layout, catch-all route, responsive design system
src/components/   Separate feature views and shared UI
src/data/         Personalized content and sourced company research
src/lib/models.ts Zod schemas and TypeScript models
src/lib/db.ts     Dexie tables, transactions, backup and restore
src/lib/store.tsx Reactive data, autosave queue, save-state reporting
src/lib/logic.ts  Readiness, recommendations, time conversion, review rules
public/documents/ Supplied source PDFs, served locally
tests/            Logic/storage and browser workflow tests
docs/             Verified interface screenshots
```

Questions include a lightweight `companyId` for future expansion; the initial workspace is intentionally focused on Axon.
