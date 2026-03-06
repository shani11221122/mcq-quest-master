import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Pencil, Search, X, Check, ChevronDown, Database, Download, Upload, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getPremiumCode, setPremiumCode } from "@/lib/auth-context";
import { subjects, type Difficulty, sampleQuestions } from "@/lib/quiz-data";
import { getAllQuestions, addQuestion, updateQuestion, deleteQuestion, importQuestions, migrateFromLocalStorage, type StoredQuestion } from "@/lib/indexeddb";
import { toast } from "sonner";

type FormData = {
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: Difficulty;
};

const emptyForm: FormData = {
  subject: "biology",
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  difficulty: "easy",
};

const difficultyColors: Record<Difficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  intermediate: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  hard: "bg-red-500/15 text-red-600 dark:text-red-400",
};

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [premiumCode, setPremiumCodeState] = useState(getPremiumCode());
  const [showPremiumEdit, setShowPremiumEdit] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate("/home");
      return;
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim()) { toast.error("Question is required"); return; }
    if (form.options.some(o => !o.trim())) { toast.error("All options are required"); return; }

    try {
      if (editingId) {
        const existing = questions.find(q => q.id === editingId)!;
        await updateQuestion({ ...existing, ...form });
        toast.success("Question updated");
      } else {
        await addQuestion(form);
        toast.success("Question added");
      }
      await reload();
      resetForm();
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuestion(id);
      toast.success("Question deleted");
      setDeleteConfirm(null);
      await reload();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const startEdit = (q: StoredQuestion) => {
    setForm({ subject: q.subject, question: q.question, options: [...q.options], correctAnswer: q.correctAnswer, difficulty: q.difficulty });
    setEditingId(q.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
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
    toast.success(`Imported ${toImport.length} default questions`);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mcq_questions.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as any[];
        await importQuestions(parsed.map(q => ({
          id: q.id || `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          subject: q.subject, question: q.question, options: q.options,
          correctAnswer: q.correctAnswer, difficulty: q.difficulty,
        })));
        await reload();
        toast.success(`Imported ${parsed.length} questions`);
      } catch { toast.error("Invalid file format"); }
    };
    input.click();
  };

  const filtered = questions.filter(q => {
    if (filterSubject !== "all" && q.subject !== filterSubject) return false;
    if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty) return false;
    if (search && !q.question.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: questions.length,
    easy: questions.filter(q => q.difficulty === "easy").length,
    intermediate: questions.filter(q => q.difficulty === "intermediate").length,
    hard: questions.filter(q => q.difficulty === "hard").length,
  };

  if (!user?.isAdmin) return null;

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="bg-primary px-4 pt-8 pb-5 shrink-0" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="text-primary-foreground active:scale-95 transition-transform duration-100">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-primary-foreground">Admin Dashboard</h1>
            <p className="text-primary-foreground/70 text-xs mt-0.5">Manage MCQ question bank</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 pt-4 pb-8 space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Total", value: stats.total, cls: "bg-primary/10 text-primary" },
              { label: "Easy", value: stats.easy, cls: difficultyColors.easy },
              { label: "Medium", value: stats.intermediate, cls: difficultyColors.intermediate },
              { label: "Hard", value: stats.hard, cls: difficultyColors.hard },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 text-center ${s.cls}`}>
                <p className="text-lg font-extrabold">{s.value}</p>
                <p className="text-[10px] font-semibold opacity-80">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { resetForm(); setShowForm(!showForm); }}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? "Cancel" : "Add MCQ"}
            </button>
            <button onClick={handleSeedDefaults}
              className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
              <Database size={14} /> Seed Defaults
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
          {showForm && (
            <form onSubmit={handleSubmit} className="border border-border rounded-2xl p-4 space-y-3 bg-card">
              <h3 className="text-sm font-bold text-foreground">{editingId ? "Edit Question" : "New Question"}</h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm appearance-none pr-8 text-foreground">
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm appearance-none pr-8 text-foreground">
                    <option value="easy">Easy</option>
                    <option value="intermediate">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <textarea placeholder="Enter your question..." value={form.question}
                onChange={e => setForm({ ...form, question: e.target.value })}
                className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none text-foreground placeholder:text-muted-foreground" />

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Options (select correct answer)</p>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <button type="button" onClick={() => setForm({ ...form, correctAnswer: i })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-100 ${form.correctAnswer === i
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
                    className="h-10 px-4 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold active:scale-[0.97] transition-transform duration-100">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..."
                className="w-full h-10 rounded-xl border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 text-muted-foreground"><X size={16} /></button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs appearance-none pr-7 text-foreground">
                  <option value="all">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative flex-1">
                <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs appearance-none pr-7 text-foreground">
                  <option value="all">All Levels</option>
                  <option value="easy">Easy</option>
                  <option value="intermediate">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Questions count */}
          <p className="text-xs text-muted-foreground font-semibold">{filtered.length} question{filtered.length !== 1 ? "s" : ""} found</p>

          {/* Question list */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No questions found</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Add questions or seed defaults to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((q) => (
                <div key={q.id} className="border border-border rounded-xl p-3 bg-card">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-semibold text-foreground flex-1 leading-snug">{q.question}</p>
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

                  {/* Options preview */}
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {q.options.map((opt, i) => (
                      <p key={i} className={`text-[11px] px-2 py-1 rounded-lg truncate ${i === q.correctAnswer
                        ? "bg-primary/10 text-primary font-bold"
                        : "bg-secondary/50 text-muted-foreground"}`}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </p>
                    ))}
                  </div>

                  <div className="flex gap-1.5 mt-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                      {subjects.find(s => s.id === q.subject)?.name || q.subject}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${difficultyColors[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
