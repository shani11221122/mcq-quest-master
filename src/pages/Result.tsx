import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result, answers, questions } = location.state || {};

  if (!result) {
    navigate("/home");
    return null;
  }

  const stats = [
    { label: "Subject", value: result.subject, color: "text-primary" },
    { label: "Correct", value: result.correct, color: "text-success" },
    { label: "Incorrect", value: result.incorrect, color: "text-destructive" },
    { label: "Overall Points", value: result.total, color: "text-primary" },
    { label: "Earned", value: result.correct, color: "text-success" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-8 pb-4">
        <button onClick={() => navigate("/home")}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-extrabold">Final Result</h1>
      </div>

      <motion.div
        className="px-6 flex-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-lg font-bold mb-6">
          {result.correct >= result.total * 0.7 ? "🎉 " : ""}
          Well Done, {user?.username || "Student"}
        </p>

        <div className="space-y-4">
          {stats.map((s) => (
            <div key={s.label} className="flex justify-between items-center">
              <span className="font-bold text-foreground">{s.label} :</span>
              <span className={`font-extrabold text-lg ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="px-6 pb-8 space-y-3">
        <button
          className="btn-primary w-full"
          onClick={() => navigate("/result/answers", { state: { answers, questions, result } })}
        >
          View Answers
        </button>
        <button
          className="btn-primary w-full opacity-80"
          onClick={() => navigate(`/quiz/${questions?.[0]?.subject || ""}`)}
        >
          Start Again
        </button>
      </div>
    </div>
  );
};

export default Result;
