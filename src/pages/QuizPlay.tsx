import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { X, Timer, TimerOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestionsBySubjectAsync, subjects, type Difficulty, type Question } from "@/lib/quiz-data";
import { useQuizTimer } from "@/hooks/use-quiz-timer";

const optionLetters = ["A", "B", "C", "D"];
const SECONDS_PER_QUESTION = 60;
const QUESTIONS_PER_CATEGORY = 10;

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Seen-pool key includes subject + difficulty for granular tracking */
function seenKey(subject: string, difficulty?: string): string {
  return `mdcat_seen_${subject}${difficulty ? `_${difficulty}` : ""}`;
}

function getSeenIds(subject: string, difficulty?: string): Set<string> {
  try {
    const raw = localStorage.getItem(seenKey(subject, difficulty));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveSeenIds(subject: string, ids: Set<string>, difficulty?: string) {
  localStorage.setItem(seenKey(subject, difficulty), JSON.stringify([...ids]));
}

const QuizPlay = () => {
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const difficulty = searchParams.get("difficulty") as Difficulty | null;
  const isTimed = searchParams.get("timed") === "true";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const key = subjectId || "";
    getQuestionsBySubjectAsync(key, difficulty || undefined).then(all => {
      const seen = getSeenIds(key, difficulty || undefined);
      let unseen = all.filter(q => !seen.has(q.id));
      if (unseen.length === 0) {
        seen.clear();
        saveSeenIds(key, seen, difficulty || undefined);
        unseen = all;
      }
      const shuffled = shuffle(unseen);
      // Limit to exactly QUESTIONS_PER_CATEGORY when a difficulty is selected
      const limited = difficulty ? shuffled.slice(0, QUESTIONS_PER_CATEGORY) : shuffled;
      seenRef.current = seen;
      setQuestions(limited);
      setAnswers(new Array(limited.length).fill(null));
      setLoading(false);
    });
  }, [subjectId, difficulty]);

  const subject = subjects.find((s) => s.id === subjectId);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);

  const totalTime = questions.length * SECONDS_PER_QUESTION;

  const finishQuiz = useCallback((finalAnswers: (number | null)[]) => {
    if (finished) return;
    setFinished(true);
    let correct = 0;
    finalAnswers.forEach((a, i) => {
      if (a === questions[i]?.correctAnswer) correct++;
    });

    // Mark all attempted questions as seen
    const key = subjectId || "";
    const seen = seenRef.current;
    questions.forEach(q => seen.add(q.id));
    saveSeenIds(key, seen, difficulty || undefined);

    const result = {
      subject: subject?.name || subjectId,
      correct,
      incorrect: questions.length - correct,
      total: questions.length,
      difficulty: difficulty || "all",
      date: new Date().toISOString(),
      timed: isTimed,
    };
    const history = JSON.parse(localStorage.getItem("mdcat_history") || "[]");
    const user = JSON.parse(localStorage.getItem("mdcat_user") || "{}");
    history.push({ ...result, username: user.username });
    localStorage.setItem("mdcat_history", JSON.stringify(history));
    navigate("/result", { state: { result, answers: finalAnswers, questions } });
  }, [finished, questions, subject, subjectId, difficulty, isTimed, navigate]);

  const handleTimeUp = useCallback(() => {
    const currentAnswers = [...answers];
    currentAnswers[current] = selected;
    finishQuiz(currentAnswers);
  }, [answers, current, selected, finishQuiz]);

  const { formatted, percentage, isLow, isCritical } = useQuizTimer({
    totalSeconds: totalTime,
    onTimeUp: handleTimeUp,
    enabled: isTimed && !finished,
  });

  if (loading) {
    return (
      <div className="h-dvh bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="h-dvh bg-background flex flex-col items-center justify-center px-6">
        <p className="text-lg font-semibold mb-4">No questions available.</p>
        <button onClick={() => navigate("/quiz")} className="btn-primary px-8">Go Back</button>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  const handleNext = () => {
    const newAnswers = [...answers];
    newAnswers[current] = selected;
    setAnswers(newAnswers);
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setSelected(newAnswers[current + 1]);
    } else {
      finishQuiz(newAnswers);
    }
  };

  return (
    <div className="h-dvh bg-background flex flex-col">
      {/* Fixed Top Bar */}
      <div className="shrink-0 px-5 pt-12 pb-3 flex items-center gap-3">
        <button onClick={() => navigate("/quiz")} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <X size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{subject?.name || "Quiz"}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {difficulty && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                difficulty === "easy"
                  ? "bg-success/10 text-success"
                  : difficulty === "intermediate"
                  ? "bg-warning/10 text-warning"
                  : "bg-destructive/10 text-destructive"
              }`}>
                {difficulty === "intermediate" ? "Medium" : difficulty}
              </span>
            )}
            {!difficulty && <span className="text-[10px] text-muted-foreground">All levels</span>}
            {isTimed && <span className="text-[10px] text-muted-foreground">• Timed</span>}
          </div>
        </div>

        {isTimed ? (
          <div
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 border shrink-0 ${
              isCritical
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : isLow
                ? "bg-warning/10 border-warning/30 text-warning"
                : "bg-card border-border text-foreground"
            }`}
          >
            <Timer size={14} className={isCritical ? "text-destructive" : isLow ? "text-warning" : "text-primary"} />
            <span className="text-xs font-bold font-mono tabular-nums">{formatted}</span>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl px-3 py-1.5 shrink-0">
            <span className="text-xs font-bold text-primary">{current + 1}</span>
            <span className="text-xs text-muted-foreground">/{questions.length}</span>
          </div>
        )}
      </div>

      {/* Fixed Progress Bar */}
      <div className="shrink-0 px-5 pb-4">
        {isTimed ? (
          <div className="space-y-1.5">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCritical ? "bg-destructive" : isLow ? "bg-warning" : "bg-primary"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-1 bg-muted rounded-full overflow-hidden flex-1">
                <div
                  className="h-full bg-primary/40 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground ml-2 tabular-nums">
                {current + 1}/{questions.length}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Scrollable Question + Options Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.1 }}
          >
            <div className="glass-card p-5 mb-5">
              <p className="text-base font-semibold leading-relaxed text-foreground">{q.question}</p>
            </div>

            <div className="space-y-3 pb-4">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                return (
                  <button
                    key={i}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-colors duration-100 text-left ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                    onClick={() => setSelected(i)}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-100 ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {optionLetters[i]}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="shrink-0 px-5 py-4 border-t border-border/50 bg-background" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}>
        <button onClick={handleNext} disabled={selected === null} className="btn-primary w-full disabled:opacity-40">
          {current === questions.length - 1 ? "Finish Quiz" : "Next Question"}
        </button>
      </div>
    </div>
  );
};

export default QuizPlay;
