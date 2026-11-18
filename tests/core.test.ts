import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  PrepDB,
  seedDatabase,
  exportBackup,
  importBackup,
  saveAnswer,
  validateBackup,
  rateQuestion,
} from "@/lib/db";
import { seedQuestions, seedStories, topIds, emptyEvent } from "@/data/seed";
import { blankAnswer } from "@/lib/models";
import {
  interviewTime,
  eventState,
  nextReview,
  metrics,
  wordCount,
  recommendations,
} from "@/lib/logic";
let db: PrepDB;
beforeEach(async () => {
  db = new PrepDB(`test-${crypto.randomUUID()}`);
  await seedDatabase(db);
});
afterEach(async () => {
  await db.delete();
});
describe("seed and content integrity", () => {
  it("seeds 80+ unique questions, all recruiter priorities, and only factual starter drafts", async () => {
    expect(seedQuestions.length).toBeGreaterThanOrEqual(80);
    expect(new Set(seedQuestions.map((q) => q.text)).size).toBe(
      seedQuestions.length,
    );
    expect(
      topIds.every((id) =>
        seedQuestions.some((q) => q.id === id && q.priority === "Critical"),
      ),
    ).toBe(true);
    expect(
      seedQuestions.every((q) =>
        q.linkedStoryIds.every((id) => seedStories.some((s) => s.id === id)),
      ),
    ).toBe(true);
    expect((await db.answers.toArray()).every((a) => a.starter)).toBe(true);
    expect(seedQuestions.every((q) => q.status === "Not Started")).toBe(true);
  });
  it("initialization never overwrites user work", async () => {
    const answer = { ...blankAnswer("why-axon"), draft: "My own answer." };
    await saveAnswer(answer, false, db);
    await seedDatabase(db);
    expect((await db.answers.get("why-axon"))?.draft).toBe("My own answer.");
  });
});
describe("persistence and backups", () => {
  it("saves variants, checkpoints the prior answer, and survives reopening", async () => {
    const answer = {
      ...blankAnswer("why-axon"),
      draft: "Personal motivation",
      quick: "Devices and software",
      starAction: "I built the backend.",
    };
    await saveAnswer(answer, true, db);
    db.close();
    await db.open();
    const saved = await db.answers.get("why-axon");
    expect(saved?.quick).toBe("Devices and software");
    expect(saved?.starAction).toBe("I built the backend.");
    expect(
      (await db.versions.where("answerId").equals("why-axon").toArray()).length,
    ).toBe(1);
    expect((await db.questions.get("why-axon"))?.status).toBe("Drafting");
  });
  it("atomically restores answers, progress, practice, and linked content to a clean database", async () => {
    await saveAnswer(
      { ...blankAnswer("why-axon"), draft: "Hardware and software connected." },
      true,
      db,
    );
    await db.questions.update("why-axon", { status: "Ready to Practice" });
    const date = new Date().toISOString();
    await db.sessions.add({
      id: "session",
      mode: "quick",
      questionIds: ["why-axon"],
      startedAt: date,
      completedAt: date,
      duration: 45,
    });
    await db.attempts.add({
      id: "attempt",
      sessionId: "session",
      questionId: "why-axon",
      date,
      duration: 45,
      answer: "My practice answer",
      ratings: {
        clarity: 4,
        relevance: 4,
        confidence: 4,
        conciseness: 4,
        structure: 4,
        evidence: 4,
      },
      notes: "Keep the opening shorter.",
    });
    await rateQuestion("why-axon", 4, db);
    const backup = await exportBackup(db);
    const clean = new PrepDB(`restore-${crypto.randomUUID()}`);
    try {
      await importBackup(JSON.parse(JSON.stringify(backup)), "replace", clean);
      expect((await clean.answers.get("why-axon"))?.draft).toBe(
        "Hardware and software connected.",
      );
      expect((await clean.questions.get("why-axon"))?.status).toBe(
        "Ready to Practice",
      );
      expect(await clean.attempts.count()).toBe(1);
      expect(await clean.reviews.count()).toBe(1);
      expect(await clean.stories.count()).toBe(6);
    } finally {
      await clean.delete();
    }
  });
  it("rejects broken references, duplicate IDs, unsafe URLs, and wrong versions before mutation", async () => {
    const backup = await exportBackup(db);
    expect(() => validateBackup({ ...backup, version: 999 })).toThrow();
    expect(() =>
      validateBackup({
        ...backup,
        questions: [...backup.questions, backup.questions[0]],
      }),
    ).toThrow();
    expect(() =>
      validateBackup({
        ...backup,
        answers: [{ ...backup.answers[0], questionId: "missing" }],
      }),
    ).toThrow();
    expect(() =>
      validateBackup({
        ...backup,
        resources: [
          {
            id: "bad",
            title: "Bad",
            url: "javascript:alert(1)",
            kind: "Article",
            date: "",
            summary: "",
            why: "",
            notes: "",
            completed: false,
          },
        ],
      }),
    ).toThrow();
    await expect(
      importBackup({ ...backup, version: 2 }, "replace", db),
    ).rejects.toThrow();
    expect(await db.questions.count()).toBe(seedQuestions.length);
  });
  it("rolls back a replacement if any write fails", async () => {
    const backup = await exportBackup(db);
    const fail = () => {
      throw new Error("Quota failure");
    };
    db.answers.hook("creating", fail);
    await expect(
      importBackup(
        {
          ...backup,
          answers: backup.answers.map((a) => ({ ...a, draft: "Replacement" })),
        },
        "replace",
        db,
      ),
    ).rejects.toThrow("Quota failure");
    db.answers.hook("creating").unsubscribe(fail);
    expect((await db.answers.get("intro"))?.draft).not.toBe("Replacement");
    expect(await db.questions.count()).toBe(seedQuestions.length);
  });
  it("merges imported matching IDs while keeping local-only records", async () => {
    const backup = await exportBackup(db);
    await db.notes.add({
      id: "local-only",
      value: "Keep me",
      updatedAt: new Date().toISOString(),
    });
    await importBackup(backup, "merge", db);
    expect((await db.notes.get("local-only"))?.value).toBe("Keep me");
  });
});
describe("time, readiness, and recommendations", () => {
  it("resolves New York times correctly in winter and summer", () => {
    expect(
      new Date(
        interviewTime({ date: "2026-11-18", time: "11:30" }),
      ).toISOString(),
    ).toBe("2026-11-18T16:30:00.000Z");
    expect(
      new Date(
        interviewTime({ date: "2027-07-18", time: "11:30" }),
      ).toISOString(),
    ).toBe("2027-07-18T15:30:00.000Z");
  });
  it("shows a past state without auto-completing an event or negative countdown", () => {
    const e = emptyEvent("test", "Screen", "2026-11-18");
    expect(eventState(e, Date.parse("2026-11-18T16:40:00Z"))).toContain(
      "in progress",
    );
    expect(eventState(e, Date.parse("2026-11-19T00:00:00Z"))).toContain("Past");
    expect(e.completed).toBe(false);
  });
  it("schedules weak answers soon and strong answers farther out", () => {
    const now = new Date("2026-11-17T12:00:00Z");
    expect(nextReview(1, now)).toBe("2026-11-17T16:00:00.000Z");
    expect(nextReview(5, now)).toBe("2026-12-01T12:00:00.000Z");
  });
  it("excludes starter drafts from completion and updates readiness from actual saved work", async () => {
    const initial = metrics(
      seedQuestions,
      await db.answers.toArray(),
      [],
      topIds,
    );
    expect(initial.answered).toBe(0);
    expect(initial.readiness).toBe(0);
    await saveAnswer(
      { ...blankAnswer("why-axon"), draft: "My own words." },
      false,
      db,
    );
    await db.questions.update("why-axon", { status: "Ready to Practice" });
    const m = metrics(
      await db.questions.toArray(),
      await db.answers.toArray(),
      [],
      topIds,
    );
    expect(m.answered).toBe(1);
    expect(m.readiness).toBe(6);
  });
  it("shifts recommendations toward AI after the recruiter screen", async () => {
    const e = emptyEvent("recruiter", "Screen", "2026-11-18");
    e.completed = true;
    const r = recommendations(
      seedQuestions,
      await db.answers.toArray(),
      [],
      seedStories,
      e,
    );
    expect(r[0].href).toBe("/technical");
  });
  it("counts words without whitespace artifacts", () => {
    expect(wordCount("  hello  world\nagain  ")).toBe(3);
    expect(wordCount("  ")).toBe(0);
  });
});

describe("minimal white design migration", () => {
  it("applies the white theme once while preserving answers and later preferences", async () => {
    await saveAnswer(
      { ...blankAnswer("why-axon"), draft: "Keep my existing answer." },
      false,
      db,
    );
    await db.settings.update("preferences", { theme: "dark" });
    await db.notes.delete("minimal-design-v2");
    await seedDatabase(db);
    expect((await db.settings.get("preferences"))?.theme).toBe("light");
    expect((await db.answers.get("why-axon"))?.draft).toBe(
      "Keep my existing answer.",
    );
    await db.settings.update("preferences", { theme: "dark" });
    await seedDatabase(db);
    expect((await db.settings.get("preferences"))?.theme).toBe("dark");
  });
});
