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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/home")}
          className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold font-display">Quiz Result</h1>
      </div>

      <div className="flex-1 px-5 flex flex-col items-center">
        {/* Score Circle */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mt-6"
        >
          <CircularProgress
            value={result.correct}
            max={result.total}
            size={160}
            strokeWidth={10}
            labelSuffix="%"
          />
        </motion.div>

        {/* Message */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold font-display">{message.msg}</h2>
          <p className="text-sm text-muted-foreground mt-1">{message.sub}</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-3 w-full mt-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
            <p className="text-2xl font-bold font-display text-foreground">{result.total}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Total</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold font-display text-primary capitalize">{result.subject}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Subject</p>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-8 space-y-3">
        <button
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={() => navigate("/result/answers", { state: { answers, questions, result } })}
        >
          <Eye size={18} />
          View Answers
        </button>
        <button
          className="w-full h-12 rounded-xl border-2 border-border text-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:border-primary/30 transition-colors active:scale-[0.98]"
          onClick={() => navigate(`/quiz/${questions?.[0]?.subject || ""}`)}
        >
          <RotateCcw size={18} />
          Try Again
        </button>
      </div>
    </div>
  );
};

export default Result;
