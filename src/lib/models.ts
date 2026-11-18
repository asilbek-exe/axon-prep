import { z } from "zod";
export const statuses = [
  "Not Started",
  "Drafting",
  "Ready to Practice",
  "Needs Improvement",
  "Confident",
  "Mastered",
] as const;
export const stages = [
  "Recruiter",
  "ACE Behavioral",
  "Traditional Coding",
  "Engineering with AI",
] as const;
export const priorities = ["Critical", "High", "Medium", "Low"] as const;
export const answerFields = [
  "draft",
  "polished",
  "quick",
  "thirty",
  "sixty",
  "bulletNotes",
  "starSituation",
  "starTask",
  "starAction",
  "starResult",
  "starReflection",
] as const;
export type AnswerField = (typeof answerFields)[number];
const id = z.string().min(1).max(200);
const date = z.string().datetime();
const text = z.string().max(200000);
export const questionSchema = z.object({
  id,
  companyId: z.literal("axon"),
  text: text.min(1),
  category: z.string(),
  stage: z.enum(stages),
  priority: z.enum(priorities),
  tags: z.array(z.string()),
  source: z.string(),
  guidance: z.string(),
  linkedStoryIds: z.array(id),
  status: z.enum(statuses),
  confidence: z.number().int().min(0).max(5),
  favorite: z.boolean(),
  reviewFlag: z.boolean(),
  custom: z.boolean(),
  notes: text,
  nextReview: date.nullable(),
  lastPracticed: date.nullable(),
  createdAt: date,
  updatedAt: date,
});
export type Question = z.infer<typeof questionSchema>;
const variantShape = Object.fromEntries(
  answerFields.map((f) => [f, text]),
) as Record<AnswerField, typeof text>;
export const answerSchema = z.object({
  id,
  questionId: id,
  ...variantShape,
  starter: z.boolean(),
  createdAt: date,
  updatedAt: date,
});
export type Answer = z.infer<typeof answerSchema>;
export const versionSchema = z.object({
  id,
  answerId: id,
  snapshot: answerSchema,
  label: z.string(),
  createdAt: date,
});
export type AnswerVersion = z.infer<typeof versionSchema>;
export const storySchema = z.object({
  id,
  title: text.min(1),
  summary: text,
  situation: text,
  task: text,
  action: text,
  result: text,
  reflection: text,
  technologies: z.array(z.string()),
  skills: z.array(z.string()),
  valueIds: z.array(z.string()),
  sourceNotes: text,
  confidence: z.number().int().min(0).max(5),
  archived: z.boolean(),
  updatedAt: date,
});
export type Story = z.infer<typeof storySchema>;
export const eventSchema = z.object({
  id,
  title: text.min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().min(1).max(1440),
  interviewer: text,
  notes: text,
  goals: text,
  questions: text,
  concerns: text,
  asked: text,
  answered: text,
  wentWell: text,
  improve: text,
  feedback: text,
  nextSteps: text,
  followUp: text,
  completed: z.boolean(),
  questionIds: z.array(id),
  updatedAt: date,
});
export type InterviewEvent = z.infer<typeof eventSchema>;
export const ratingKeys = [
  "clarity",
  "relevance",
  "confidence",
  "conciseness",
  "structure",
  "evidence",
] as const;
const rating = z.number().int().min(1).max(5);
export const attemptSchema = z.object({
  id,
  sessionId: id,
  questionId: id,
  date,
  duration: z.number().min(0),
  answer: text,
  ratings: z.object({
    clarity: rating,
    relevance: rating,
    confidence: rating,
    conciseness: rating,
    structure: rating,
    evidence: rating,
  }),
  notes: text,
});
export type Attempt = z.infer<typeof attemptSchema>;
export const sessionSchema = z.object({
  id,
  mode: z.string(),
  questionIds: z.array(id),
  startedAt: date,
  completedAt: date.nullable(),
  duration: z.number().min(0),
});
export type Session = z.infer<typeof sessionSchema>;
export const noteSchema = z.object({ id, value: text, updatedAt: date });
export type Note = z.infer<typeof noteSchema>;
export const resourceSchema = z.object({
  id,
  title: text.min(1),
  url: z
    .string()
    .url()
    .refine((s) => /^https?:\/\//.test(s), "Use an http or https URL"),
  kind: z.enum(["Article", "Coding problem", "Resource"]),
  date: z.string(),
  summary: text,
  why: text,
  notes: text,
  completed: z.boolean(),
});
export type Resource = z.infer<typeof resourceSchema>;
export const reviewSchema = z.object({
  id,
  questionId: id,
  date,
  confidence: rating,
  previousConfidence: z.number().min(0).max(5),
});
export type Review = z.infer<typeof reviewSchema>;
export const settingsSchema = z.object({
  id: z.literal("preferences"),
  speakingRate: z.number().int().min(90).max(220),
  name: z.string().min(1),
  theme: z.enum(["dark", "light"]),
});
export type Settings = z.infer<typeof settingsSchema>;
export function blankAnswer(questionId: string): Answer {
  const now = new Date().toISOString();
  return {
    id: questionId,
    questionId,
    ...(Object.fromEntries(answerFields.map((f) => [f, ""])) as Record<
      AnswerField,
      string
    >),
    starter: false,
    createdAt: now,
    updatedAt: now,
  };
}
export const backupSchema = z.object({
  format: z.literal("axon-prep"),
  version: z.literal(1),
  exportedAt: date,
  questions: z.array(questionSchema),
  answers: z.array(answerSchema),
  versions: z.array(versionSchema),
  stories: z.array(storySchema),
  events: z.array(eventSchema),
  attempts: z.array(attemptSchema),
  sessions: z.array(sessionSchema),
  notes: z.array(noteSchema),
  resources: z.array(resourceSchema),
  reviews: z.array(reviewSchema),
  settings: z.array(settingsSchema).length(1),
});
export type Backup = z.infer<typeof backupSchema>;
