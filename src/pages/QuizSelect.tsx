import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { subjects } from "@/lib/quiz-data";
import type { Difficulty } from "@/lib/quiz-data";

const QuizSelect = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");

  const difficultyColors: Record<string, string> = {
    all: "bg-muted text-foreground",
    easy: "bg-success text-success-foreground",
    intermediate: "bg-warning text-warning-foreground",
    hard: "bg-destructive text-destructive-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button onClick={() => navigate("/home")}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-extrabold">Quiz</h1>
      </div>

      {/* Difficulty Filter */}
      <div className="px-6 pb-4 flex gap-2 overflow-x-auto">
        {(["all", "easy", "intermediate", "hard"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-4 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all ${
              difficulty === d ? difficultyColors[d] : "bg-muted/50 text-muted-foreground"
            }`}
          >
            {d === "all" ? "All Levels" : d}
          </button>
        ))}
      </div>

      <motion.div
        className="px-6 space-y-4 pb-8"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {subjects.map((s) => (
          <motion.button
            key={s.id}
            className="menu-card w-full active:scale-[0.97]"
            onClick={() => navigate(`/quiz/${s.id}${difficulty !== "all" ? `?difficulty=${difficulty}` : ""}`)}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-4xl">{s.icon}</span>
            <span className="font-bold text-lg">{s.name}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default QuizSelect;
