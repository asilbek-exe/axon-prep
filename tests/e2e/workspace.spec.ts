import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
const appURL = (path: string) =>
  `${process.env.PLAYWRIGHT_APP_PATH || ""}${path}`;
test("recruiter answer → refresh → readiness → practice → export → clean import", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(appURL("/recruiter-prep"));
  await page
    .getByRole("button", { name: /Know why you want to join Axon/ })
    .click();
  await page.getByRole("link", { name: /Prepare “Why Axon/ }).click();
  await expect(
    page.getByRole("heading", { name: "Why Axon?", exact: true }),
  ).toBeVisible();
  const answer =
    "I want to work on software connected to real devices. My Raspberry Pi and FastAPI work made that interest concrete.";
  await page
    .getByRole("textbox", { name: "Your answer", exact: true })
    .fill(answer);
  await page.getByRole("button", { name: "Save answer", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved" }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toHaveValue(answer);
  await page.getByRole("button", { name: "15 seconds", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Your answer", exact: true })
    .fill("I enjoy connecting reliable software with devices.");
  // Immediate navigation must flush the debounce, including separate answer variants.
  await page
    .getByRole("link", { name: "Preparation plan", exact: true })
    .click();
  await expect(
    page
      .locator(".guide-step")
      .filter({ hasText: "Know why you want to join Axon" }),
  ).toContainText("Answer saved");
  await page.goto(appURL("/questions/why-axon"));
  await page.getByRole("button", { name: "15 seconds", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toHaveValue("I enjoy connecting reliable software with devices.");
  await page
    .getByRole("button", { name: "Mark as ready", exact: true })
    .click();
  await expect(page.getByLabel("Preparation status")).toHaveValue(
    "Ready to Practice",
  );
  await page
    .getByRole("link", { name: "Preparation plan", exact: true })
    .click();
  await expect(
    page
      .locator(".guide-step")
      .filter({ hasText: "Know why you want to join Axon" }),
  ).toContainText("Answer saved");
  await page.goto(appURL("/practice?question=why-axon"));
  await page
    .getByRole("button", { name: "Start practice session", exact: true })
    .click();
  await page.getByRole("button", { name: "Start timer", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Practice response", exact: true })
    .fill(
      "My connection is working across Raspberry Pi, vision processing, and FastAPI.",
    );
  await page.getByRole("button", { name: "Confidence 4", exact: true }).click();
  await page
    .getByRole("button", { name: "Save & complete session", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Practice, reflected on." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View practice history", exact: true })
    .click();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await page.locator("summary").filter({ hasText: "Why Axon?" }).click();
  await expect(
    page.getByText(
      "My connection is working across Raspberry Pi, vision processing, and FastAPI.",
    ),
  ).toBeVisible();
  await page.goto(appURL("/settings"));
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export all data", exact: true })
    .click();
  const download = await downloadPromise;
  const path = await download.path();
  const contents = await fs.readFile(path!, "utf8");
  const backup = JSON.parse(contents);
  expect(backup.format).toBe("axon-prep");
  expect(backup.attempts).toHaveLength(1);
  const clean = await browser.newContext();
  const restore = await clean.newPage();
  await restore.goto(appURL("/settings"));
  await restore.getByLabel("Import backup file").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(contents),
  });
  await restore.getByLabel("Import behavior").selectOption("replace");
  await restore.getByRole("checkbox", { name: /I understand/ }).check();
  await restore
    .getByRole("button", { name: "Confirm import", exact: true })
    .click();
  await expect(
    restore.getByText(
      "Import complete. Answers, progress, and history restored.",
    ),
  ).toBeVisible();
  await restore.goto(appURL("/questions/why-axon"));
  await expect(
    restore.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toHaveValue(answer);
  await expect(restore.getByLabel("Preparation status")).toHaveValue(
    "Ready to Practice",
  );
  await restore.goto(appURL("/dashboard"));
  await expect(
    restore
      .locator(".guide-step")
      .filter({ hasText: "Know why you want to join Axon" }),
  ).toContainText("Answer saved");
  await clean.close();
  expect(errors).toEqual([]);
});
test("filters, custom questions, story links, active recall, and invalid import", async ({
  page,
}) => {
  await page.goto(appURL("/questions"));
  await page.getByRole("textbox", { name: "Search questions" }).fill("eBPF");
  await expect(page.locator(".question-row")).toHaveCount(2);
  await page.getByRole("textbox", { name: "Search questions" }).fill("");
  await page
    .getByLabel("Round", { exact: true })
    .selectOption("ACE Behavioral");
  await expect(page.locator(".question-row").first()).toBeVisible();
  await page.getByRole("button", { name: "New question", exact: true }).click();
  await page
    .getByLabel("Question", { exact: true })
    .fill("What did I learn from the latest deployment?");
  await page
    .getByRole("button", { name: "Create question", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "What did I learn from the latest deployment?",
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "What did I learn from the latest deployment?",
    }),
  ).toBeVisible();
  await page.getByLabel("Owning LASSO").click();
  await expect(page.getByLabel("Owning LASSO")).toBeChecked();
  await page.getByRole("button", { name: "Confidence 1", exact: true }).click();
  await page
    .getByRole("link", { name: "Review & Progress", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Active recall", exact: true })
    .first()
    .click();
  await expect(page.locator(".prepared-notes")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Reveal my answer", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Recall confidence 4", exact: true })
    .click();
  await expect(
    page.getByText("Review saved. Next review scheduled."),
  ).toBeVisible();
  await page.goto(appURL("/settings"));
  await page.getByLabel("Import backup file").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"other"}'),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "Invalid backup" }),
  ).toBeVisible();
});
test("all main pages render and mobile editing remains usable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/dashboard",
    "/recruiter-prep",
    "/questions",
    "/answers",
    "/stories",
    "/company",
    "/journey",
    "/practice",
    "/technical",
    "/review",
    "/resources",
    "/settings",
    "/call-mode",
  ]) {
    await page.goto(appURL(route));
    await expect(page.locator("main h1")).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appURL("/dashboard"));
  await expect(page.locator("main h1")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("link", { name: "Preparation plan", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Know why you want to join Axon/ })
    .click();
  await page.getByRole("link", { name: /Prepare “Why Axon/ }).click();
  await page
    .getByRole("textbox", { name: "Your answer", exact: true })
    .fill("A mobile answer that should save.");
  await page.getByRole("button", { name: "Save answer", exact: true }).click();
  await expect(
    page.getByText("Answer saved. Manual checkpoint added to history."),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toHaveValue("A mobile answer that should save.");
  await expect(page.locator(".page-enter")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "test-results/mobile-editor.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("stories, checklist, call mode, journey reflections, and answer version restore", async ({
  page,
}) => {
  await page.goto(appURL("/stories?story=lasso-story"));
  await page
    .getByLabel("Task", { exact: true })
    .fill("Explain a concrete responsibility from my production work.");
  await page
    .getByLabel("Reflection", { exact: true })
    .fill("Keep the explanation focused on my own decisions.");
  await page.getByRole("button", { name: "Save story", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Task", { exact: true })).toHaveValue(
    "Explain a concrete responsibility from my production work.",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.goto(appURL("/recruiter-reference"));
  await page.getByLabel("Review introduction", { exact: true }).click();
  await expect(
    page.getByLabel("Review introduction", { exact: true }),
  ).toBeChecked();
  await page.getByLabel("Select recruiter question 3", { exact: true }).click();
  await expect(
    page.getByLabel("Select recruiter question 3", { exact: true }),
  ).toBeChecked();
  await page
    .getByLabel("Edit question 3", { exact: true })
    .fill("How are software interns matched to their engineering teams?");
  await page
    .getByRole("link", { name: "Open call mode", exact: true })
    .first()
    .click();
  await expect(
    page.getByText(
      "How are software interns matched to their engineering teams?",
      { exact: true },
    ),
  ).toBeVisible();
  await page.goto(appURL("/journey"));
  await page
    .locator(".timeline-event")
    .filter({ hasText: "Recruiter screen with Nicholas" })
    .getByRole("button", { name: "Edit event & reflection" })
    .click();
  await page
    .getByLabel("Next steps", { exact: true })
    .fill("Confirm the next round and prepare the AI exercise.");
  await page.getByRole("button", { name: "Save event", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await expect(
    page.getByText("Confirm the next round and prepare the AI exercise.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.goto(appURL("/questions/why-axon"));
  const first = "My first version connects my background to Axon.";
  await page
    .getByRole("textbox", { name: "Your answer", exact: true })
    .fill(first);
  await page.getByRole("button", { name: "Save answer", exact: true }).click();
  await expect(page.locator(".editor-bottom").getByRole("status")).toHaveText(
    "Saved",
  );
  await page
    .getByRole("textbox", { name: "Your answer", exact: true })
    .fill("My revised second version.");
  await page.getByRole("button", { name: "Save answer", exact: true }).click();
  await expect(page.locator(".editor-bottom").getByRole("status")).toHaveText(
    "Saved",
  );
  await page.getByRole("button", { name: /Versions \(/ }).click();
  await page.getByLabel("Choose a previous version").selectOption({ index: 2 });
  await expect(
    page
      .locator(".compare-grid")
      .getByText(`draft:\n${first}`, { exact: true }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Restore this version", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toHaveValue(first);
});

test("timer pause and resume, global search, resource persistence, and printable sheet", async ({
  page,
}) => {
  await page.goto(appURL("/dashboard"));
  await page.getByRole("button", { name: /Search workspace/ }).click();
  await page
    .getByRole("textbox", { name: "Search workspace" })
    .fill("Why Axon");
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /^Why Axon\?/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Why Axon?", exact: true }),
  ).toBeVisible();
  await page.goto(appURL("/practice?question=why-axon"));
  await page.getByRole("button", { name: "Start practice session" }).click();
  await page.getByRole("button", { name: "Start timer", exact: true }).click();
  await expect
    .poll(async () => await page.locator(".timer").innerText())
    .not.toBe("08:00");
  await page.getByRole("button", { name: "Pause timer", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Practice response" })
    .fill("A saved practice draft.");
  await page
    .getByRole("link", { name: "Preparation plan", exact: true })
    .click();
  await page.getByRole("link", { name: "Mock Interview", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Practice response" }),
  ).toHaveValue("A saved practice draft.");
  await expect(
    page.getByRole("button", { name: "Start timer", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save & complete session" }).click();
  await page.goto(appURL("/resources?kind=Coding%20problem"));
  await page.getByRole("button", { name: "Save a resource" }).click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Reservation interval practice");
  await page
    .getByLabel("Source URL", { exact: true })
    .fill("https://example.com/my-practice");
  await page
    .getByRole("button", { name: "Save resource", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Reservation interval practice" }),
  ).toBeVisible();
  await page.goto(appURL("/company?cheat=true"));
  await expect(
    page.getByRole("heading", { name: "Axon, at a glance." }),
  ).toBeVisible();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Markdown" }).click();
  expect((await dl).suggestedFilename()).toBe("axon-cheat-sheet.md");
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: "test-results/cheat-sheet.pdf",
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
});

test("clean desktop screenshot and mobile dashboard fit", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(appURL("/dashboard"));
  await expect(page.getByText("0 of 6 steps complete")).toBeVisible();
  await expect(page.locator(".page-enter")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: "docs/dashboard.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByText("11:30 AM EST · 15 min", { exact: false }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({ path: "docs/mobile-dashboard.png" });
});

test("minimal guide keeps steps, notes, and chosen recruiter questions across reloads", async ({
  page,
}) => {
  await page.goto(appURL("/dashboard"));
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(
    page.getByRole("heading", { name: /Your 15-minute interview/ }),
  ).toBeVisible();
  await expect(page.locator(".guide-step.expanded")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Question Bank", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Done, next step" }).click();
  await expect(page.getByText("1 of 6 steps complete")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Know why you want to join Axon/ }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.reload();
  await expect(page.getByText("1 of 6 steps complete")).toBeVisible();
  await page
    .getByRole("button", { name: /Choose two questions for Nicholas/ })
    .click();
  await page.getByLabel("Select recruiter question 3").click();
  await expect(page.getByLabel("Select recruiter question 3")).toBeChecked();
  await page.getByLabel("Select recruiter question 7").click();
  await expect(page.getByLabel("Select recruiter question 7")).toBeChecked();
  await page.locator(".guide-question-pick").first().locator("summary").click();
  await page
    .getByRole("textbox", { name: "Edit question 3" })
    .fill("How will I find the right engineering team?");
  await page
    .getByRole("link", { name: "Open call notes", exact: true })
    .click();
  await expect(
    page.getByText("How will I find the right engineering team?", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(appURL("/dashboard"));
  await page.getByRole("button", { name: /Prepare your introduction/ }).click();
  await page.getByRole("button", { name: "Mark as unfinished" }).click();
  await expect(page.getByText("0 of 6 steps complete")).toBeVisible();
  await page.getByText("Library & later rounds", { exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Question Bank", exact: true }),
  ).toBeVisible();
});

test("static entry, deep links, and source PDFs work below the project path", async ({
  page,
  request,
}) => {
  await page.goto(appURL("/"));
  await expect(
    page.getByRole("heading", { name: /Your 15-minute interview/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Write my introduction" }).click();
  await expect(
    page.getByRole("heading", { name: "Tell me about yourself.", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Tell me about yourself.", exact: true }),
  ).toBeVisible();
  await page.goto(appURL("/resources/"));
  for (const filename of ["asilbek-resume.pdf", "axon-interview-guide.pdf"]) {
    const path = appURL(`/documents/${filename}`);
    await expect(page.locator(`a[href="${path}"]`)).toBeVisible();
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  }
});
