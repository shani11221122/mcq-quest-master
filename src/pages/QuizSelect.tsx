import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Timer, TimerOff } from "lucide-react";
import { motion } from "framer-motion";
import { subjects, getQuestionsBySubject } from "@/lib/quiz-data";
import type { Difficulty } from "@/lib/quiz-data";
import PageShell from "@/components/PageShell";

const subjectIcons: Record<string, string> = {
  biology: "🧬",
  chemistry: "⚗️",
  physics: "⚛️",
  english: "📖",
  reasoning: "🧠",
};

const QuizSelect = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [search, setSearch] = useState("");
  const [timedMode, setTimedMode] = useState(false);

  const difficulties: { key: Difficulty | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "easy", label: "Easy" },
    { key: "intermediate", label: "Medium" },
    { key: "hard", label: "Hard" },
  ];

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const history = JSON.parse(localStorage.getItem("mdcat_history") || "[]");

  const buildUrl = (subjectId: string) => {
    const params = new URLSearchParams();
    if (difficulty !== "all") params.set("difficulty", difficulty);
    if (timedMode) params.set("timed", "true");
    const qs = params.toString();
    return `/quiz/${subjectId}${qs ? `?${qs}` : ""}`;
  };

  return (
    <PageShell>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold font-display">Choose Subject</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full pl-10"
          />
        </div>

        {/* Timed Mode Toggle + Difficulty */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setTimedMode(!timedMode)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 ${
              timedMode
                ? "bg-warning text-warning-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {timedMode ? <Timer size={14} /> : <TimerOff size={14} />}
            {timedMode ? "Timed" : "No Timer"}
          </button>
          <div className="w-px h-6 bg-border shrink-0" />
          {difficulties.map((d) => (
            <button
              key={d.key}
              onClick={() => setDifficulty(d.key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 ${
                difficulty === d.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {timedMode && (
          <motion.p
            className="text-[11px] text-warning font-medium bg-warning/10 px-3 py-2 rounded-xl"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            ⏱ Timer mode: 1 minute per question. Quiz auto-submits when time runs out.
          </motion.p>
        )}
      </div>

      {/* Subject Grid */}
      <motion.div
        className="px-5 grid grid-cols-2 gap-3 pb-4"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
      >
        {filteredSubjects.map((s) => {
          const qCount = getQuestionsBySubject(s.id, difficulty === "all" ? undefined : difficulty).length;
          const subjectHistory = history.filter((h: any) => h.subject?.toLowerCase() === s.name?.toLowerCase() || h.subject === s.id);
          const totalAttempts = subjectHistory.reduce((acc: number, h: any) => acc + h.total, 0);
          const totalCorrect = subjectHistory.reduce((acc: number, h: any) => acc + h.correct, 0);
          const progress = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

          return (
            <motion.button
              key={s.id}
              className="glass-card p-4 text-left active:scale-[0.97] group"
              onClick={() => navigate(buildUrl(s.id))}
              variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="text-3xl mb-3">{subjectIcons[s.id] || s.icon}</div>
              <p className="font-semibold text-sm text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{qCount} questions</p>

              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{progress}% accuracy</p>
            </motion.button>
          );
        })}
      </motion.div>
    </PageShell>
  );
};

export default QuizSelect;
