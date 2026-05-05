import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import CircularProgress from "@/components/CircularProgress";

const motivationalMessages = [
  { min: 90, msg: "Outstanding! 🏆", sub: "You're a top performer!" },
  { min: 70, msg: "Great job! 🎉", sub: "Keep up the excellent work!" },
  { min: 50, msg: "Good effort! 💪", sub: "You're getting there!" },
  { min: 0, msg: "Keep practicing! 📚", sub: "Every attempt makes you stronger." },
];

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result, answers, questions } = location.state || {};

  if (!result) {
    navigate("/home");
    return null;
  }

  const percentage = Math.round((result.correct / result.total) * 100);
  const message = motivationalMessages.find((m) => percentage >= m.min)!;

  return (
    <div className="h-dvh bg-background flex flex-col">
      <div className="shrink-0 px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate("/quiz")} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold font-display">Quiz Result</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25, duration: 0.2 }}
          className="mt-6 flex justify-center"
        >
          <CircularProgress value={result.correct} max={result.total} size={160} strokeWidth={10} labelSuffix="%" />
        </motion.div>

        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12, delay: 0.08 }}
        >
          <h2 className="text-2xl font-bold font-display">{message.msg}</h2>
          <p className="text-sm text-muted-foreground mt-1">{message.sub}</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 gap-3 w-full mt-8 pb-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12, delay: 0.1 }}
        >
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold font-display text-success">{result.correct}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Correct</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold font-display text-destructive">{result.incorrect}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Incorrect</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold font-display text-foreground">10</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Total</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold font-display text-primary capitalize">{result.subject}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Subject</p>
          </div>
        </motion.div>
      </div>

      <div className="shrink-0 px-5 py-4 space-y-3 border-t border-border/50 bg-background" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}>
        <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => navigate("/result/answers", { state: { answers, questions, result } })}>
          <Eye size={18} /> View Answers
        </button>
        <button
          className="w-full h-12 rounded-xl border-2 border-border text-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:border-primary/30 transition-colors duration-100 active:scale-[0.98]"
          onClick={() => navigate(`/quiz/${questions?.[0]?.subject || ""}`)}
        >
          <RotateCcw size={18} /> Try Again
        </button>
      </div>
    </div>
  );
};

export default Result;
