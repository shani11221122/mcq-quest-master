import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { motion } from "framer-motion";
import { subjects, getQuestionsBySubject } from "@/lib/quiz-data";
import type { Difficulty } from "@/lib/quiz-data";
import BottomNav from "@/components/BottomNav";

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

  const difficulties: { key: Difficulty | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "easy", label: "Easy" },
    { key: "intermediate", label: "Medium" },
    { key: "hard", label: "Hard" },
  ];

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Get user history for progress
  const history = JSON.parse(localStorage.getItem("mdcat_history") || "[]");

  return (
    <div className="min-h-screen bg-background pb-20">
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

        {/* Difficulty Chips */}
        <div className="flex gap-2">
          {difficulties.map((d) => (
            <button
              key={d.key}
              onClick={() => setDifficulty(d.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                difficulty === d.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
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
              onClick={() =>
                navigate(`/quiz/${s.id}${difficulty !== "all" ? `?difficulty=${difficulty}` : ""}`)
              }
              variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="text-3xl mb-3">{subjectIcons[s.id] || s.icon}</div>
              <p className="font-semibold text-sm text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{qCount} questions</p>

              {/* Progress bar */}
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

      <BottomNav />
    </div>
  );
};

export default QuizSelect;
