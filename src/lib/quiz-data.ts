export type Difficulty = "easy" | "intermediate" | "hard";

export interface Question {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: Difficulty;
}

export interface QuizResult {
  id: string;
  username: string;
  subject: string;
  correct: number;
  incorrect: number;
  total: number;
  date: string;
  difficulty: Difficulty;
}

export const subjects = [
  { id: "biology", name: "Biology", icon: "🧬" },
  { id: "chemistry", name: "Chemistry", icon: "⚗️" },
  { id: "physics", name: "Physics", icon: "⚛️" },
  { id: "english", name: "English Grammar", icon: "📖" },
  { id: "reasoning", name: "Logical Reasoning", icon: "🧠" },
];

import { questionBank } from "./question-bank";

/** Full question bank (450 questions across 5 subjects × 3 difficulties) */
export const sampleQuestions: Question[] = questionBank;

/** 
 * Get questions by subject - now async, reads from IndexedDB + sample questions.
 * For synchronous backward compatibility, also provides a sync version using sampleQuestions only.
 */
export function getQuestionsBySubject(subject: string, difficulty?: Difficulty): Question[] {
  // Sync version: returns only sample questions (used in QuizPlay initial render)
  let questions = sampleQuestions.filter(q => q.subject === subject);
  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  return questions;
}

/** Async version that includes IndexedDB questions (deduplicated by ID) */
export async function getQuestionsBySubjectAsync(subject: string, difficulty?: Difficulty): Promise<Question[]> {
  const { getAllQuestions } = await import("@/lib/indexeddb");
  const dbQuestions = await getAllQuestions();
  // Deduplicate: DB questions override sample questions with same ID
  const map = new Map<string, Question>();
  sampleQuestions.forEach(q => map.set(q.id, q));
  dbQuestions.forEach(q => map.set(q.id, q));
  let questions = Array.from(map.values()).filter(q => q.subject === subject);
  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  return questions;
}
