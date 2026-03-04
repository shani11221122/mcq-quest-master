import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { sampleQuestions, subjects, type Difficulty, type Question } from "@/lib/quiz-data";
import { toast } from "sonner";

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem("mdcat_custom_questions");
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    subject: "biology",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    difficulty: "easy" as Difficulty,
  });

  if (!user?.isAdmin) {
    navigate("/home");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question || form.options.some(o => !o.trim())) {
      toast.error("Fill all fields");
      return;
    }
    const newQ: Question = { id: `custom_${Date.now()}`, ...form };
    const updated = [...questions, newQ];
    setQuestions(updated);
    localStorage.setItem("mdcat_custom_questions", JSON.stringify(updated));
    toast.success("Question added!");
    setForm({ subject: "biology", question: "", options: ["", "", "", ""], correctAnswer: 0, difficulty: "easy" });
    setShowForm(false);
  };

  const deleteQuestion = (id: string) => {
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    localStorage.setItem("mdcat_custom_questions", JSON.stringify(updated));
    toast.success("Deleted");
  };

  const allQuestions = [...sampleQuestions, ...questions];
  const filtered = allQuestions.filter(q => {
    if (filterSubject !== "all" && q.subject !== filterSubject) return false;
    if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="auth-header px-6 pt-8 pb-6 rounded-b-[2rem]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="text-primary-foreground">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-extrabold text-primary-foreground">Admin Panel</h1>
        </div>
        <p className="text-primary-foreground/80 mt-1">Manage questions & difficulty levels</p>
      </div>

      <div className="px-6 pt-6 pb-8">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="input-field text-sm h-10 px-3">
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="input-field text-sm h-10 px-3">
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="intermediate">Intermediate</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{filtered.length} questions</p>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold">
            <Plus size={16} /> Add Question
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="border border-border rounded-2xl p-4 mb-6 space-y-3">
            <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="input-field w-full h-10 text-sm">
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as Difficulty })} className="input-field w-full h-10 text-sm">
              <option value="easy">Easy</option>
              <option value="intermediate">Intermediate</option>
              <option value="hard">Hard</option>
            </select>
            <textarea placeholder="Question text" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} className="input-field w-full min-h-[80px] py-3 resize-none" />
            {form.options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="radio" name="correct" checked={form.correctAnswer === i} onChange={() => setForm({ ...form, correctAnswer: i })} className="accent-primary w-4 h-4" />
                <input placeholder={`Option ${i + 1}`} value={opt} onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts }); }} className="input-field flex-1 h-10 text-sm" />
              </div>
            ))}
            <button type="submit" className="btn-primary w-full h-10 text-sm">Save Question</button>
          </form>
        )}

        <div className="space-y-3">
          {filtered.slice(0, 20).map((q) => (
            <div key={q.id} className="border border-border rounded-xl p-3">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm font-bold flex-1">{q.question}</p>
                {q.id.startsWith("custom_") && (
                  <button onClick={() => deleteQuestion(q.id)} className="text-destructive shrink-0"><Trash2 size={16} /></button>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{q.subject}</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">{q.difficulty}</span>
              </div>
            </div>
          ))}
          {filtered.length > 20 && <p className="text-sm text-muted-foreground text-center">Showing first 20 of {filtered.length}</p>}
        </div>
      </div>
    </div>
  );
};

export default Admin;
