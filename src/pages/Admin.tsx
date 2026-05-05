import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Pencil, Search, X, Check, ChevronDown,
  Database, Download, Upload, KeyRound, BookOpen, BarChart3,
  Shield, LogOut, ChevronRight, Layers, Clock, TrendingUp, Eye, EyeOff, UserCog, Users, Activity
} from "lucide-react";
import AdminUsers from "@/components/AdminUsers";
import AdminMonitoring from "@/components/AdminMonitoring";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { getPremiumCode, setPremiumCode } from "@/lib/auth-context";
import { subjects, type Difficulty, sampleQuestions } from "@/lib/quiz-data";
import {
  getAllQuestions, addQuestion, updateQuestion, deleteQuestion,
  importQuestions, migrateFromLocalStorage, type StoredQuestion
} from "@/lib/indexeddb";
import { parseQuizJson, buildExportPayload, downloadJson } from "@/lib/quiz-schema";
import { logActivity } from "@/lib/admin-activity";
import AdminActivity from "@/components/AdminActivity";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";

// ─── Types & Constants ───

type FormData = {
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: Difficulty;
};

type BatchEntry = FormData;

type View = "dashboard" | "subject" | "batch" | "users" | "monitoring";

const emptyForm: FormData = {
  subject: "biology",
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  difficulty: "easy",
};

const subjectIcons: Record<string, string> = {
  biology: "🧬",
  chemistry: "⚗️",
  physics: "⚛️",
  english: "📖",
  reasoning: "🧠",
};

const difficultyColors: Record<Difficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  intermediate: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  hard: "bg-red-500/15 text-red-600 dark:text-red-400",
};

// ─── Main Component ───

const Admin = () => {
  const navigate = useNavigate();
  const { user, logout, changeAdminCredentials } = useAuth();
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("dashboard");
  const [activeSubject, setActiveSubject] = useState<string>("");

  // Subject MCQ management state
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Batch insert state
  const [batchSubject, setBatchSubject] = useState("biology");
  const [batchDifficulty, setBatchDifficulty] = useState<Difficulty>("easy");
  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([]);
  const [currentBatchIdx, setCurrentBatchIdx] = useState(0);

  // Premium code
  const [premiumCode, setPremiumCodeState] = useState(getPremiumCode());
  const [showPremiumEdit, setShowPremiumEdit] = useState(false);

  // Credential change state
  const [showCredChange, setShowCredChange] = useState(false);
  const [credCurrentPass, setCredCurrentPass] = useState("");
  const [credNewUsername, setCredNewUsername] = useState("");
  const [credNewPassword, setCredNewPassword] = useState("");
  const [credConfirmPassword, setCredConfirmPassword] = useState("");
  const [credShowPasswords, setCredShowPasswords] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) { navigate("/home"); return; }
    (async () => {
      await migrateFromLocalStorage();
      const all = await getAllQuestions();
      setQuestions(all);
      setLoading(false);
    })();
  }, [user, navigate]);

  const reload = useCallback(async () => {
    const all = await getAllQuestions();
    setQuestions(all);
  }, []);

  // ─── Dashboard Stats ───

  const history = JSON.parse(localStorage.getItem("mdcat_history") || "[]");
  const recentQuestions = [...questions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  const getSubjectStats = (subjectId: string) => {
    const subjectQs = questions.filter(q => q.subject === subjectId);
    return {
      total: subjectQs.length,
      easy: subjectQs.filter(q => q.difficulty === "easy").length,
      intermediate: subjectQs.filter(q => q.difficulty === "intermediate").length,
      hard: subjectQs.filter(q => q.difficulty === "hard").length,
    };
  };

  const totalUsers = (() => {
    try { return JSON.parse(localStorage.getItem("mdcat_users") || "[]").length; } catch { return 0; }
  })();

  const totalStats = {
    total: questions.length,
    subjects: subjects.length,
    recentlyAdded: questions.filter(q => Date.now() - q.createdAt < 7 * 24 * 60 * 60 * 1000).length,
    quizAttempts: history.length,
    users: totalUsers,
  };

  // ─── Analytics Data ───

  const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning, 45 93% 47%))", "hsl(142 76% 36%)", "hsl(262 83% 58%)"];

  const subjectAccuracyData = useMemo(() =>
    subjects.map(s => {
      const sh = history.filter((h: any) => h.subject?.toLowerCase() === s.name?.toLowerCase() || h.subject === s.id);
      const total = sh.reduce((a: number, h: any) => a + h.total, 0);
      const correct = sh.reduce((a: number, h: any) => a + h.correct, 0);
      return { name: s.name.split(" ")[0], accuracy: total > 0 ? Math.round((correct / total) * 100) : 0, attempts: sh.length };
    }), [history]
  );

  const dailyTrendData = useMemo(() => {
    const days = new Map<string, { date: string; attempts: number; avgAccuracy: number; totalCorrect: number; totalQ: number }>();
    history.forEach((h: any) => {
      const d = new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const existing = days.get(d) || { date: d, attempts: 0, avgAccuracy: 0, totalCorrect: 0, totalQ: 0 };
      existing.attempts++;
      existing.totalCorrect += h.correct || 0;
      existing.totalQ += h.total || 0;
      days.set(d, existing);
    });
    return Array.from(days.values()).slice(-14).map(d => ({
      ...d, avgAccuracy: d.totalQ > 0 ? Math.round((d.totalCorrect / d.totalQ) * 100) : 0,
    }));
  }, [history]);

  const difficultyDistData = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 };
    history.forEach((h: any) => {
      const d = h.difficulty;
      if (d === "easy") counts.Easy++;
      else if (d === "intermediate") counts.Medium++;
      else if (d === "hard") counts.Hard++;
      else counts.Easy++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [history]);
  // ─── MCQ CRUD Handlers ───

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim()) { toast.error("Question is required"); return; }
    if (form.options.some(o => !o.trim())) { toast.error("All options are required"); return; }
    try {
      if (editingId) {
        const existing = questions.find(q => q.id === editingId)!;
        await updateQuestion({ ...existing, ...form });
        logActivity("mcq_update", `Updated MCQ in ${form.subject} (${form.difficulty}): "${form.question.slice(0, 60)}${form.question.length > 60 ? "…" : ""}"`, { id: editingId, subject: form.subject });
        toast.success("Question updated");
      } else {
        await addQuestion(form);
        logActivity("mcq_add", `Added MCQ to ${form.subject} (${form.difficulty}): "${form.question.slice(0, 60)}${form.question.length > 60 ? "…" : ""}"`, { subject: form.subject });
        toast.success("Question added");
      }
      await reload();
      resetForm();
    } catch { toast.error("Failed to save"); }
  };

  const handleDelete = async (id: string) => {
    try {
      const q = questions.find(x => x.id === id);
      await deleteQuestion(id);
      if (q) logActivity("mcq_delete", `Deleted MCQ from ${q.subject} (${q.difficulty}): "${q.question.slice(0, 60)}${q.question.length > 60 ? "…" : ""}"`, { id, subject: q.subject });
      toast.success("Question deleted");
      setDeleteConfirm(null);
      await reload();
    } catch { toast.error("Failed to delete"); }
  };

  const startEdit = (q: StoredQuestion) => {
    setForm({ subject: q.subject, question: q.question, options: [...q.options], correctAnswer: q.correctAnswer, difficulty: q.difficulty });
    setEditingId(q.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ ...emptyForm, subject: activeSubject || "biology" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSeedDefaults = async () => {
    const existing = await getAllQuestions();
    const existingIds = new Set(existing.map(q => q.id));
    const toImport = sampleQuestions.filter(q => !existingIds.has(q.id));
    if (!toImport.length) { toast.info("All default questions already exist"); return; }
    await importQuestions(toImport);
    await reload();
    logActivity("mcq_seed", `Seeded ${toImport.length} default question${toImport.length !== 1 ? "s" : ""}`, { count: toImport.length });
    toast.success(`Imported ${toImport.length} default questions`);
  };

  const handleExport = async () => {
    try {
      // Always pull the freshest snapshot so "Export All" reflects current DB
      const all = await getAllQuestions();
      if (!all.length) { toast.error("No questions to export"); return; }
      const payload = buildExportPayload(all);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadJson(`mdcat_questions_${stamp}.json`, payload);
      logActivity("mcq_export", `Exported ${all.length} question${all.length !== 1 ? "s" : ""} to JSON`, { count: all.length });
      toast.success(`Exported ${all.length} questions`);
    } catch (e) {
      toast.error(`Export failed: ${(e as Error).message}`);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json,application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const result = parseQuizJson(text);
        if (!result.questions.length) {
          toast.error(result.errors[0] || "No valid questions found");
          if (result.errors.length > 1) console.warn("Import errors:", result.errors);
          return;
        }
        await importQuestions(result.questions.map(q => ({
          id: q.id || `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          subject: q.subject,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
        })));
        await reload();
        const fname = file.name;
        if (result.errors.length) {
          logActivity("mcq_import", `Imported ${result.questions.length} from ${fname} (${result.errors.length} skipped)`, { file: fname, imported: result.questions.length, skipped: result.errors.length });
          toast.warning(`Imported ${result.questions.length}, skipped ${result.errors.length}`);
          console.warn("Skipped rows:", result.errors);
        } else {
          logActivity("mcq_import", `Imported ${result.questions.length} question${result.questions.length !== 1 ? "s" : ""} from ${fname}`, { file: fname, imported: result.questions.length });
          toast.success(`Imported ${result.questions.length} questions`);
        }
      } catch (err) {
        toast.error(`Import failed: ${(err as Error).message}`);
      }
    };
    input.click();
  };

  // ─── Batch Insert ───

  const initBatch = () => {
    const entries: BatchEntry[] = Array.from({ length: 10 }, () => ({
      subject: batchSubject,
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      difficulty: batchDifficulty,
    }));
    setBatchEntries(entries);
    setCurrentBatchIdx(0);
    setView("batch");
  };

  const updateBatchEntry = (idx: number, update: Partial<BatchEntry>) => {
    const entries = [...batchEntries];
    entries[idx] = { ...entries[idx], ...update };
    setBatchEntries(entries);
  };

  const handleBatchSubmit = async () => {
    const valid = batchEntries.filter(
      e => e.question.trim() && e.options.every(o => o.trim())
    );
    if (valid.length === 0) { toast.error("No valid questions to submit"); return; }
    try {
      for (const entry of valid) {
        await addQuestion(entry);
      }
      await reload();
      logActivity("mcq_bulk_add", `Bulk added ${valid.length} ${batchSubject} MCQ${valid.length !== 1 ? "s" : ""} (${batchDifficulty})`, { subject: batchSubject, difficulty: batchDifficulty, count: valid.length });
      toast.success(`${valid.length} questions added successfully`);
      setView("subject");
    } catch { toast.error("Failed to save batch"); }
  };

  // ─── Filtered questions for subject view ───

  // Grouped + ordered by difficulty (Easy → Medium → Hard) so numbering stays organized.
  const subjectQuestions = (() => {
    const order: Difficulty[] = ["easy", "intermediate", "hard"];
    const base = questions
      .filter(q => q.subject === activeSubject)
      .filter(q => filterDifficulty === "all" || q.difficulty === filterDifficulty)
      .filter(q => !search || q.question.toLowerCase().includes(search.toLowerCase()));
    return base.sort((a, b) => {
      const da = order.indexOf(a.difficulty);
      const db = order.indexOf(b.difficulty);
      if (da !== db) return da - db;
      return a.createdAt - b.createdAt;
    });
  })();

  const groupedSubjectQuestions = (() => {
    const groups: { difficulty: Difficulty; label: string; items: StoredQuestion[] }[] = [
      { difficulty: "easy", label: "Easy", items: [] },
      { difficulty: "intermediate", label: "Medium", items: [] },
      { difficulty: "hard", label: "Hard", items: [] },
    ];
    subjectQuestions.forEach(q => {
      const g = groups.find(g => g.difficulty === q.difficulty);
      if (g) g.items.push(q);
    });
    return groups.filter(g => g.items.length > 0);
  })();

  // ─── Admin Logout ───

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user?.isAdmin) return null;

  // ═══════════════════════════════════════════════════════
  //  RENDER: BATCH INSERT VIEW
  // ═══════════════════════════════════════════════════════

  if (view === "users") {
    return <AdminUsers onBack={() => setView("dashboard")} />;
  }

  if (view === "monitoring") {
    return (
      <div className="h-dvh flex flex-col bg-background">
        <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border">
          <button onClick={() => setView("dashboard")} className="p-2 -ml-2 active:scale-95 transition-transform duration-100">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground">Live Monitoring</h1>
            <p className="text-[11px] text-muted-foreground">Online users and activity</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <AdminMonitoring />
        </div>
      </div>
    );
  }

  if (view === "batch") {
    const entry = batchEntries[currentBatchIdx];
    const filledCount = batchEntries.filter(e => e.question.trim() && e.options.every(o => o.trim())).length;

    return (
      <div className="h-dvh flex flex-col bg-background">
        {/* Header */}
        <div className="bg-primary px-4 pt-8 pb-4 shrink-0" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setView("subject")} className="text-primary-foreground">
              <ArrowLeft size={22} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-primary-foreground">Batch Insert</h1>
              <p className="text-primary-foreground/60 text-xs">
                {subjects.find(s => s.id === batchSubject)?.name} · {batchDifficulty} · {filledCount}/10 filled
              </p>
            </div>
            <button
              onClick={handleBatchSubmit}
              disabled={filledCount === 0}
              className="bg-primary-foreground/20 text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
            >
              Save All ({filledCount})
            </button>
          </div>
        </div>

        {/* Question navigator */}
        <div className="shrink-0 px-4 py-3 flex gap-1.5 overflow-x-auto scrollbar-none border-b border-border">
          {batchEntries.map((e, i) => {
            const filled = e.question.trim() && e.options.every(o => o.trim());
            return (
              <button
                key={i}
                onClick={() => setCurrentBatchIdx(i)}
                className={`w-9 h-9 rounded-xl text-xs font-bold shrink-0 transition-all duration-100 ${
                  i === currentBatchIdx
                    ? "bg-primary text-primary-foreground shadow-md scale-110"
                    : filled
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Batch form */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Question {currentBatchIdx + 1} of 10
              </label>
              <textarea
                placeholder="Enter your question..."
                value={entry.question}
                onChange={e => updateBatchEntry(currentBatchIdx, { question: e.target.value })}
                className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Options (tap letter to mark correct)</p>
              {entry.options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => updateBatchEntry(currentBatchIdx, { correctAnswer: i })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-100 ${
                      entry.correctAnswer === i
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {entry.correctAnswer === i ? <Check size={14} /> : String.fromCharCode(65 + i)}
                  </button>
                  <input
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    value={opt}
                    onChange={e => {
                      const opts = [...entry.options];
                      opts[i] = e.target.value;
                      updateBatchEntry(currentBatchIdx, { options: opts });
                    }}
                    className="flex-1 h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="shrink-0 px-4 py-3 border-t border-border flex gap-2" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button
            onClick={() => setCurrentBatchIdx(Math.max(0, currentBatchIdx - 1))}
            disabled={currentBatchIdx === 0}
            className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-foreground disabled:opacity-30"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentBatchIdx(Math.min(9, currentBatchIdx + 1))}
            disabled={currentBatchIdx === 9}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  //  RENDER: SUBJECT MCQ MANAGEMENT VIEW
  // ═══════════════════════════════════════════════════════

  if (view === "subject") {
    const subjectName = subjects.find(s => s.id === activeSubject)?.name || activeSubject;
    const stats = getSubjectStats(activeSubject);

    return (
      <div className="h-dvh flex flex-col bg-background">
        {/* Header */}
        <div className="bg-primary px-4 pt-8 pb-5 shrink-0" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => { setView("dashboard"); resetForm(); setSearch(""); setFilterDifficulty("all"); }} className="text-primary-foreground">
              <ArrowLeft size={22} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-primary-foreground">
                {subjectIcons[activeSubject]} {subjectName}
              </h1>
              <p className="text-primary-foreground/60 text-xs">MCQ Management</p>
            </div>
          </div>

          {/* Subject stats */}
          <div className="flex gap-2 mt-4">
            {[
              { label: "Total", value: stats.total, cls: "bg-primary-foreground/15 text-primary-foreground" },
              { label: "Easy", value: stats.easy, cls: "bg-primary-foreground/10 text-primary-foreground/80" },
              { label: "Medium", value: stats.intermediate, cls: "bg-primary-foreground/10 text-primary-foreground/80" },
              { label: "Hard", value: stats.hard, cls: "bg-primary-foreground/10 text-primary-foreground/80" },
            ].map(s => (
              <div key={s.label} className={`flex-1 rounded-xl p-2.5 text-center ${s.cls}`}>
                <p className="text-lg font-extrabold">{s.value}</p>
                <p className="text-[9px] font-semibold opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 pt-4 pb-8 space-y-4">

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { resetForm(); setForm(f => ({ ...f, subject: activeSubject })); setShowForm(!showForm); }}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
                {showForm ? <X size={14} /> : <Plus size={14} />}
                {showForm ? "Cancel" : "Add MCQ"}
              </button>
              <button onClick={() => { setBatchSubject(activeSubject); initBatch(); }}
                className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
                <Layers size={14} /> Add 10 MCQs
              </button>
              <button onClick={handleExport}
                className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
                <Download size={14} /> Export
              </button>
              <button onClick={handleImport}
                className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
                <Upload size={14} /> Import
              </button>
            </div>

            {/* Add/Edit Form */}
            <AnimatePresence>
              {showForm && (
                <motion.form
                  onSubmit={handleSubmit}
                  className="border border-border rounded-2xl p-4 space-y-3 bg-card"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <h3 className="text-sm font-bold text-foreground">{editingId ? "Edit Question" : "New Question"}</h3>

                  <div className="relative">
                    <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm appearance-none pr-8 text-foreground">
                      <option value="easy">Easy</option>
                      <option value="intermediate">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
                  </div>

                  <textarea placeholder="Enter your question..." value={form.question}
                    onChange={e => setForm({ ...form, question: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none text-foreground placeholder:text-muted-foreground" />

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Options (select correct answer)</p>
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <button type="button" onClick={() => setForm({ ...form, correctAnswer: i })}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-100 ${
                            form.correctAnswer === i
                              ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                          {form.correctAnswer === i ? <Check size={14} /> : String.fromCharCode(65 + i)}
                        </button>
                        <input placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt}
                          onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts }); }}
                          className="flex-1 h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground" />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-sm font-bold active:scale-[0.97] transition-transform duration-100">
                      {editingId ? "Update" : "Save"} Question
                    </button>
                    {editingId && (
                      <button type="button" onClick={resetForm}
                        className="h-10 px-4 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold">
                        Cancel
                      </button>
                    )}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..."
                  className="w-full h-10 rounded-xl border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground" />
                {search && <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 text-muted-foreground"><X size={16} /></button>}
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {[
                  { key: "all", label: "All" },
                  { key: "easy", label: "Easy" },
                  { key: "intermediate", label: "Medium" },
                  { key: "hard", label: "Hard" },
                ].map(d => (
                  <button key={d.key} onClick={() => setFilterDifficulty(d.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors duration-100 ${
                      filterDifficulty === d.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-semibold">{subjectQuestions.length} question{subjectQuestions.length !== 1 ? "s" : ""}</p>

            {/* Question list */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
            ) : subjectQuestions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No questions found</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Add questions or seed defaults</p>
              </div>
            ) : (
              <div className="space-y-5">
                {groupedSubjectQuestions.map((group) => (
                  <div key={group.difficulty} className="space-y-2">
                    <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-1.5 -mx-1 px-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${difficultyColors[group.difficulty]}`}>
                          {group.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          {group.items.length} question{group.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {group.items.map((q, idx) => (
                      <div key={q.id} className="border border-border rounded-xl p-3 bg-card">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex gap-2 flex-1 min-w-0">
                            <span className="shrink-0 w-7 h-7 rounded-lg bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <p className="text-sm font-semibold text-foreground flex-1 leading-snug pt-0.5">{q.question}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => startEdit(q)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary active:scale-90 transition-transform duration-100">
                              <Pencil size={13} />
                            </button>
                            {deleteConfirm === q.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleDelete(q.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-destructive text-destructive-foreground active:scale-90 transition-transform duration-100">
                                  <Check size={13} />
                                </button>
                                <button onClick={() => setDeleteConfirm(null)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground active:scale-90 transition-transform duration-100">
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(q.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive active:scale-90 transition-transform duration-100">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-1 pl-9">
                          {q.options.map((opt, i) => (
                            <p key={i} className={`text-[11px] px-2 py-1 rounded-lg truncate ${
                              i === q.correctAnswer
                                ? "bg-primary/10 text-primary font-bold"
                                : "bg-secondary/50 text-muted-foreground"}`}>
                              {String.fromCharCode(65 + i)}. {opt}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  //  RENDER: MAIN DASHBOARD VIEW
  // ═══════════════════════════════════════════════════════

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-foreground)/0.08),transparent_50%)]" />

        <div className="relative px-5 pt-12 pb-6" style={{ paddingTop: "max(3rem, env(safe-area-inset-top))" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/home")} className="text-primary-foreground/80">
                <ArrowLeft size={22} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
                  <Shield size={20} className="text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-primary-foreground">Admin Panel</h1>
                  <p className="text-primary-foreground/50 text-[10px] font-medium">
                    {user?.username || "Admin"}
                  </p>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="bg-primary-foreground/15 text-primary-foreground p-2 rounded-xl">
              <LogOut size={18} />
            </button>
          </div>

          {/* Overview cards */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Users, label: "Users", value: totalStats.users },
              { icon: Database, label: "Total MCQs", value: totalStats.total },
              { icon: BookOpen, label: "Subjects", value: totalStats.subjects },
              { icon: TrendingUp, label: "Attempts", value: totalStats.quizAttempts },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <Icon size={16} className="text-primary-foreground/70 mx-auto mb-1" />
                  <p className="text-xl font-extrabold text-primary-foreground">{s.value}</p>
                  <p className="text-[9px] font-semibold text-primary-foreground/50 uppercase tracking-wider">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-5 pt-5 pb-8 space-y-5">

          {/* Subject Cards */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-3">Subjects</h2>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map(s => {
                const st = getSubjectStats(s.id);
                return (
                  <motion.button
                    key={s.id}
                    className="glass-card p-4 text-left active:scale-[0.97] transition-transform duration-100"
                    onClick={() => { setActiveSubject(s.id); setView("subject"); setForm(f => ({ ...f, subject: s.id })); }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{subjectIcons[s.id]}</span>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-sm text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{st.total} MCQs</p>
                    <div className="flex gap-1 mt-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">E:{st.easy}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">M:{st.intermediate}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400">H:{st.hard}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-3">Quick Actions</h2>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setView("users")}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
                <Users size={14} /> Manage Users
              </button>
              <button onClick={() => setView("monitoring")}
                className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
                <Activity size={14} /> Live Monitoring
              </button>
              <button onClick={handleSeedDefaults}
                className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
                <Database size={14} /> Seed Defaults
              </button>
              <button onClick={handleExport}
                className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
                <Download size={14} /> Export All
              </button>
              <button onClick={handleImport}
                className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
                <Upload size={14} /> Import JSON
              </button>
            </div>
          </div>

          {/* Recent Admin Activity (real-time feed) */}
          <AdminActivity />

          {/* Analytics Charts */}
          {history.length > 0 && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-foreground">Analytics</h2>

              {/* Subject Accuracy Bar Chart */}
              <div className="border border-border rounded-2xl p-4 bg-card">
                <h3 className="text-sm font-bold text-foreground mb-3">Accuracy by Subject</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectAccuracyData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 700 }}
                        formatter={(value: number) => [`${value}%`, "Accuracy"]}
                      />
                      <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                        {subjectAccuracyData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Trend Line Chart */}
              {dailyTrendData.length > 1 && (
                <div className="border border-border rounded-2xl p-4 bg-card">
                  <h3 className="text-sm font-bold text-foreground mb-3">Performance Trend</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 700 }}
                        />
                        <Line type="monotone" dataKey="avgAccuracy" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} name="Accuracy %" />
                        <Line type="monotone" dataKey="attempts" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Attempts" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Difficulty Distribution Pie */}
              <div className="border border-border rounded-2xl p-4 bg-card">
                <h3 className="text-sm font-bold text-foreground mb-3">Quiz Difficulty Distribution</h3>
                <div className="h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyDistData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        <Cell fill="hsl(142 76% 36%)" />
                        <Cell fill="hsl(var(--warning, 45 93% 47%))" />
                        <Cell fill="hsl(var(--destructive))" />
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                        formatter={(value: number) => [value, "Quizzes"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="border border-border rounded-2xl p-4 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">Premium Unlock Code</h3>
              </div>
              <button onClick={() => setShowPremiumEdit(!showPremiumEdit)}
                className="text-xs text-primary font-semibold">{showPremiumEdit ? "Cancel" : "Edit"}</button>
            </div>
            {showPremiumEdit ? (
              <div className="flex gap-2 mt-3">
                <input value={premiumCode} onChange={e => setPremiumCodeState(e.target.value)}
                  className="flex-1 h-9 rounded-xl border border-input bg-background px-3 text-sm font-mono uppercase text-foreground" />
                <button onClick={() => { setPremiumCode(premiumCode); setShowPremiumEdit(false); logActivity("premium_code_update", "Premium unlock code updated"); toast.success("Code updated"); }}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-xl text-xs font-bold">Save</button>
              </div>
            ) : (
              <p className="mt-2 text-sm font-mono tracking-wider text-muted-foreground">{premiumCode}</p>
            )}
          </div>

          {/* Admin Credentials */}
          <div className="border border-border rounded-2xl p-4 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCog size={16} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">Admin Credentials</h3>
              </div>
              <button onClick={() => { setShowCredChange(!showCredChange); setCredCurrentPass(""); setCredNewUsername(""); setCredNewPassword(""); setCredConfirmPassword(""); }}
                className="text-xs text-primary font-semibold">{showCredChange ? "Cancel" : "Change"}</button>
            </div>
            {showCredChange ? (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Current Password</label>
                  <div className="relative">
                    <input
                      type={credShowPasswords ? "text" : "password"}
                      value={credCurrentPass}
                      onChange={e => setCredCurrentPass(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full h-9 rounded-xl border border-input bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                    <button type="button" onClick={() => setCredShowPasswords(!credShowPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {credShowPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">New Username (optional)</label>
                  <input
                    type="text"
                    value={credNewUsername}
                    onChange={e => setCredNewUsername(e.target.value)}
                    placeholder="Leave empty to keep current"
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">New Password (optional)</label>
                  <input
                    type={credShowPasswords ? "text" : "password"}
                    value={credNewPassword}
                    onChange={e => setCredNewPassword(e.target.value)}
                    placeholder="Leave empty to keep current"
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                {credNewPassword && (
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Confirm New Password</label>
                    <input
                      type={credShowPasswords ? "text" : "password"}
                      value={credConfirmPassword}
                      onChange={e => setCredConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                )}
                <button
                  onClick={() => {
                    if (!credCurrentPass) { toast.error("Current password is required"); return; }
                    if (credNewPassword && credNewPassword !== credConfirmPassword) { toast.error("Passwords do not match"); return; }
                    if (credNewPassword && credNewPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
                    const success = changeAdminCredentials(credCurrentPass, credNewUsername, credNewPassword);
                    if (success) {
                      const parts = [credNewUsername && "username", credNewPassword && "password"].filter(Boolean).join(" & ");
                      logActivity("admin_credentials_update", `Admin ${parts || "credentials"} updated`);
                      toast.success("Credentials updated successfully");
                      setShowCredChange(false);
                    } else {
                      toast.error("Current password is incorrect");
                    }
                  }}
                  className="w-full h-10 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
                >
                  Update Credentials
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Change your admin username and password</p>
            )}
          </div>

          {recentQuestions.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-3">Recently Added</h2>
              <div className="space-y-2">
                {recentQuestions.map(q => (
                  <div key={q.id} className="glass-card p-3 flex items-center gap-3">
                    <span className="text-lg">{subjectIcons[q.subject]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{q.question}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {subjects.find(s => s.id === q.subject)?.name} · {q.difficulty === "intermediate" ? "Medium" : q.difficulty}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${difficultyColors[q.difficulty]}`}>
                      {q.difficulty === "intermediate" ? "Med" : q.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Activity Summary */}
          {history.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-3">Quiz Activity</h2>
              <div className="glass-card p-4 space-y-3">
                {subjects.map(s => {
                  const subjectHistory = history.filter((h: any) =>
                    h.subject?.toLowerCase() === s.name?.toLowerCase() || h.subject === s.id
                  );
                  const attempts = subjectHistory.length;
                  const correct = subjectHistory.reduce((acc: number, h: any) => acc + h.correct, 0);
                  const total = subjectHistory.reduce((acc: number, h: any) => acc + h.total, 0);
                  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <span className="text-lg">{subjectIcons[s.id]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{s.name}</p>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${accuracy}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-foreground">{accuracy}%</p>
                        <p className="text-[10px] text-muted-foreground">{attempts} quiz{attempts !== 1 ? "zes" : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
