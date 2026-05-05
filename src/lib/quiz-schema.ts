import { z } from "zod";
import type { StoredQuestion } from "./indexeddb";

/**
 * MDCAT MCQ JSON Schema
 * ─────────────────────
 * Required format for import/export:
 *
 * {
 *   "version": 1,
 *   "exportedAt": "2026-05-05T00:00:00.000Z",
 *   "count": 2,
 *   "questions": [
 *     {
 *       "id": "q_xxx",                // optional on import (auto-generated)
 *       "subject": "biology",          // one of: biology, chemistry, physics, english, reasoning
 *       "question": "Question text?",
 *       "options": ["A", "B", "C", "D"],     // exactly 4 strings, all non-empty
 *       "correctAnswer": 0,                  // integer 0..3 indexing options[]
 *       "difficulty": "easy"                 // easy | intermediate | hard
 *     }
 *   ]
 * }
 *
 * Backward compatible: a bare array of questions (legacy export) is also accepted.
 */

export const VALID_SUBJECTS = ["biology", "chemistry", "physics", "english", "reasoning"] as const;
export const VALID_DIFFICULTIES = ["easy", "intermediate", "hard"] as const;

const QuestionSchema = z.object({
  id: z.string().min(1).optional(),
  subject: z.enum(VALID_SUBJECTS),
  question: z.string().trim().min(3, "question too short").max(2000),
  options: z.array(z.string().trim().min(1, "option cannot be empty")).length(4, "options must contain exactly 4 entries"),
  correctAnswer: z.number().int().min(0).max(3),
  difficulty: z.enum(VALID_DIFFICULTIES),
});

const EnvelopeSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().optional(),
  count: z.number().int().nonnegative().optional(),
  questions: z.array(QuestionSchema),
});

export type ParsedQuestion = z.infer<typeof QuestionSchema>;

export interface ParseResult {
  ok: boolean;
  questions: ParsedQuestion[];
  errors: string[];
}

/** Parse + validate a JSON string. Returns per-row errors and the valid subset. */
export function parseQuizJson(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { ok: false, questions: [], errors: [`Invalid JSON: ${(e as Error).message}`] };
  }

  // Accept legacy bare array
  const candidate = Array.isArray(data) ? { version: 1 as const, questions: data } : data;

  const env = EnvelopeSchema.safeParse(candidate);
  if (!env.success) {
    // Try per-row reporting if envelope failed because of the array
    const errors: string[] = [];
    const arr = (candidate as any)?.questions;
    if (!Array.isArray(arr)) {
      errors.push("Expected an object with a `questions` array, or a bare array of questions.");
      return { ok: false, questions: [], errors };
    }
    const valid: ParsedQuestion[] = [];
    arr.forEach((row, i) => {
      const r = QuestionSchema.safeParse(row);
      if (r.success) valid.push(r.data);
      else errors.push(`Row ${i + 1}: ${r.error.issues.map(x => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
    });
    return { ok: valid.length > 0, questions: valid, errors };
  }

  return { ok: true, questions: env.data.questions, errors: [] };
}

export function buildExportPayload(questions: StoredQuestion[]) {
  return {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    count: questions.length,
    questions: questions.map(q => ({
      id: q.id,
      subject: q.subject,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
    })),
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
