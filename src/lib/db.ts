import Dexie, { type Table } from "dexie";
import {
  Question,
  Answer,
  AnswerVersion,
  Story,
  InterviewEvent,
  Attempt,
  Session,
  Note,
  Resource,
  Review,
  Settings,
  Backup,
  backupSchema,
} from "./models";
import {
  seedQuestions,
  seedAnswers,
  seedStories,
  seedEvents,
  askNicholas,
} from "@/data/seed";
import { nextReview } from "./logic";
export class PrepDB extends Dexie {
  questions!: Table<Question, string>;
  answers!: Table<Answer, string>;
  versions!: Table<AnswerVersion, string>;
  stories!: Table<Story, string>;
  events!: Table<InterviewEvent, string>;
  attempts!: Table<Attempt, string>;
  sessions!: Table<Session, string>;
  notes!: Table<Note, string>;
  resources!: Table<Resource, string>;
  reviews!: Table<Review, string>;
  settings!: Table<Settings, string>;
  constructor(name = "axon-prep-v1") {
    super(name);
    this.version(1).stores({
      questions: "id,stage,priority,status,updatedAt",
      answers: "id,questionId,updatedAt",
      versions: "id,answerId,createdAt",
      stories: "id,updatedAt",
      events: "id,date",
      attempts: "id,questionId,sessionId,date",
      sessions: "id,startedAt",
      notes: "id",
      resources: "id,kind",
      reviews: "id,questionId,date",
      settings: "id",
    });
  }
}
export const db = new PrepDB();
export const tableNames = [
  "questions",
  "answers",
  "versions",
  "stories",
  "events",
  "attempts",
  "sessions",
  "notes",
  "resources",
  "reviews",
  "settings",
] as const;
export async function seedDatabase(database: PrepDB = db) {
  await database.transaction("rw", database.tables, async () => {
    if (await database.settings.get("preferences")) {
      // Apply the requested white redesign once, without resetting preparation data.
      // A later explicit theme choice remains respected.
      if (!(await database.notes.get("minimal-design-v2"))) {
        await database.settings.update("preferences", { theme: "light" });
        await database.notes.put({
          id: "minimal-design-v2",
          value: "applied",
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }
    await database.questions.bulkPut(seedQuestions);
    await database.answers.bulkPut(seedAnswers);
    await database.stories.bulkPut(seedStories);
    await database.events.bulkPut(seedEvents);
    await database.settings.put({
      id: "preferences",
      speakingRate: 140,
      name: "Asilbek",
      theme: "light",
    });
    await database.notes.put({
      id: "minimal-design-v2",
      value: "applied",
      updatedAt: new Date().toISOString(),
    });
    await database.notes.bulkPut(
      askNicholas.map((value, i) => ({
        id: `ask-${i}`,
        value,
        updatedAt: new Date().toISOString(),
      })),
    );
  });
}
export async function saveAnswer(
  answer: Answer,
  explicit = false,
  database: PrepDB = db,
) {
  await database.transaction(
    "rw",
    [database.answers, database.versions, database.questions],
    async () => {
      const old = await database.answers.get(answer.id);
      const time = new Date().toISOString();
      const changed =
        old &&
        JSON.stringify({ ...old, updatedAt: "" }) !==
          JSON.stringify({ ...answer, updatedAt: "" });
      if (old && (explicit || changed)) {
        const latest = await database.versions
          .where("answerId")
          .equals(answer.id)
          .sortBy("createdAt");
        if (
          explicit ||
          !latest.length ||
          Date.now() - Date.parse(latest.at(-1)!.createdAt) > 30000
        ) {
          await database.versions.put({
            id: crypto.randomUUID(),
            answerId: answer.id,
            snapshot: explicit ? { ...answer, updatedAt: time } : old,
            label: explicit ? "Manual checkpoint" : "Automatic checkpoint",
            createdAt: time,
          });
          if (latest.length >= 30)
            await database.versions.bulkDelete(
              latest.slice(0, latest.length - 29).map((v) => v.id),
            );
        }
      }
      await database.answers.put({ ...answer, updatedAt: time });
      const q = await database.questions.get(answer.questionId);
      if (q)
        await database.questions.update(q.id, {
          updatedAt: time,
          ...(q.status === "Not Started" && !answer.starter
            ? { status: "Drafting" }
            : {}),
        });
    },
  );
}
export async function rateQuestion(
  questionId: string,
  confidence: number,
  database: PrepDB = db,
) {
  await database.transaction(
    "rw",
    [database.questions, database.reviews],
    async () => {
      const q = await database.questions.get(questionId);
      if (!q) return;
      const date = new Date().toISOString();
      await database.reviews.add({
        id: crypto.randomUUID(),
        questionId,
        date,
        confidence,
        previousConfidence: q.confidence,
      });
      await database.questions.update(questionId, {
        confidence,
        nextReview: nextReview(confidence),
        reviewFlag: confidence < 3,
        status:
          confidence < 3
            ? "Needs Improvement"
            : confidence === 5
              ? "Confident"
              : q.status,
        updatedAt: date,
      });
    },
  );
}
export async function exportBackup(database: PrepDB = db): Promise<Backup> {
  return database.transaction("r", database.tables, async () => {
    const records = Object.fromEntries(
      await Promise.all(
        tableNames.map(async (key) => [
          key,
          await database.table(key).toArray(),
        ]),
      ),
    );
    return backupSchema.parse({
      format: "axon-prep",
      version: 1,
      exportedAt: new Date().toISOString(),
      ...records,
    });
  });
}
export function validateBackup(raw: unknown): Backup {
  const result = backupSchema.parse(raw);
  for (const key of tableNames) {
    const ids = result[key].map((x) => x.id);
    if (new Set(ids).size !== ids.length)
      throw new Error(`Duplicate IDs in ${key}.`);
  }
  const qs = new Set(result.questions.map((q) => q.id));
  const ss = new Set(result.stories.map((s) => s.id));
  const as = new Set(result.answers.map((a) => a.id));
  const sessions = new Set(result.sessions.map((s) => s.id));
  if (result.questions.some((q) => q.linkedStoryIds.some((id) => !ss.has(id))))
    throw new Error("A linked story is missing.");
  if (
    result.answers.some(
      (a) => !qs.has(a.questionId) || a.id !== a.questionId,
    ) ||
    result.reviews.some((a) => !qs.has(a.questionId)) ||
    result.attempts.some(
      (a) => !qs.has(a.questionId) || !sessions.has(a.sessionId),
    ) ||
    result.versions.some(
      (v) => !as.has(v.answerId) || v.snapshot.id !== v.answerId,
    ) ||
    result.sessions.some((s) => s.questionIds.some((id) => !qs.has(id))) ||
    result.events.some((e) => e.questionIds.some((id) => !qs.has(id)))
  )
    throw new Error("The backup contains broken record references.");
  return result;
}
export async function importBackup(
  raw: unknown,
  mode: "merge" | "replace",
  database: PrepDB = db,
) {
  const data = validateBackup(raw);
  await database.transaction("rw", database.tables, async () => {
    if (mode === "replace")
      for (const key of tableNames) await database.table(key).clear();
    for (const key of tableNames) await database.table(key).bulkPut(data[key]);
  });
}
export function downloadFile(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function deleteQuestion(id: string) {
  await db.transaction("rw", db.tables, async () => {
    const q = await db.questions.get(id);
    if (!q?.custom) return;
    await db.questions.delete(id);
    await db.answers.delete(id);
    await db.versions.where("answerId").equals(id).delete();
    await db.attempts.where("questionId").equals(id).delete();
    await db.reviews.where("questionId").equals(id).delete();
    for (const s of await db.sessions.toArray())
      if (s.questionIds.includes(id))
        await db.sessions.update(s.id, {
          questionIds: s.questionIds.filter((x) => x !== id),
        });
    for (const e of await db.events.toArray())
      if (e.questionIds.includes(id))
        await db.events.update(e.id, {
          questionIds: e.questionIds.filter((x) => x !== id),
        });
  });
}
