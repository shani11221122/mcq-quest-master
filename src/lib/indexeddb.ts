const DB_NAME = "mdcat_quiz_db";
const DB_VERSION = 1;
const QUESTIONS_STORE = "questions";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUESTIONS_STORE)) {
        const store = db.createObjectStore(QUESTIONS_STORE, { keyPath: "id" });
        store.createIndex("subject", "subject", { unique: false });
        store.createIndex("difficulty", "difficulty", { unique: false });
        store.createIndex("subject_difficulty", ["subject", "difficulty"], { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "intermediate" | "hard";
  createdAt: number;
  updatedAt: number;
}

export async function addQuestion(q: Omit<StoredQuestion, "id" | "createdAt" | "updatedAt">): Promise<StoredQuestion> {
  const db = await openDB();
  const now = Date.now();
  const record: StoredQuestion = { ...q, id: `q_${now}_${Math.random().toString(36).slice(2, 8)}`, createdAt: now, updatedAt: now };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUESTIONS_STORE, "readwrite");
    tx.objectStore(QUESTIONS_STORE).add(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateQuestion(q: StoredQuestion): Promise<StoredQuestion> {
  const db = await openDB();
  const updated = { ...q, updatedAt: Date.now() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUESTIONS_STORE, "readwrite");
    tx.objectStore(QUESTIONS_STORE).put(updated);
    tx.oncomplete = () => resolve(updated);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUESTIONS_STORE, "readwrite");
    tx.objectStore(QUESTIONS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllQuestions(): Promise<StoredQuestion[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUESTIONS_STORE, "readonly");
    const req = tx.objectStore(QUESTIONS_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getQuestionsBySubjectFromDB(subject: string): Promise<StoredQuestion[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUESTIONS_STORE, "readonly");
    const idx = tx.objectStore(QUESTIONS_STORE).index("subject");
    const req = idx.getAll(subject);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function importQuestions(questions: Omit<StoredQuestion, "createdAt" | "updatedAt">[]): Promise<void> {
  const db = await openDB();
  const now = Date.now();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUESTIONS_STORE, "readwrite");
    const store = tx.objectStore(QUESTIONS_STORE);
    questions.forEach((q) => {
      store.put({ ...q, createdAt: now, updatedAt: now });
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQuestionCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUESTIONS_STORE, "readonly");
    const req = tx.objectStore(QUESTIONS_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Migrate localStorage questions to IndexedDB (run once) */
export async function migrateFromLocalStorage(): Promise<number> {
  const raw = localStorage.getItem("mdcat_custom_questions");
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as any[];
    if (!parsed.length) return 0;
    await importQuestions(parsed.map((q) => ({
      id: q.id || `migrated_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      subject: q.subject,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
    })));
    localStorage.removeItem("mdcat_custom_questions");
    return parsed.length;
  } catch {
    return 0;
  }
}
