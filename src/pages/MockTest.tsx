import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Timer, Lock, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestionsBySubjectAsync, subjects, type Difficulty, type Question } from "@/lib/quiz-data";
import { useQuizTimer } from "@/hooks/use-quiz-timer";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const optionLetters = ["A", "B", "C", "D"];
const MOCK_TOTAL = 50;
const MOCK_EASY = 10;
const MOCK_MEDIUM = 10;
const MOCK_HARD = 10;
const MOCK_RANDOM = MOCK_TOTAL - MOCK_EASY - MOCK_MEDIUM - MOCK_HARD; // 20
const SECONDS_PER_QUESTION = 60;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function buildMockTest(): Promise<Question[]> {
  // Gather all questions from all subjects
  const allByDifficulty: Record<Difficulty, Question[]> = { easy: [], intermediate: [], hard: [] };
  for (const s of subjects) {
    const qs = await getQuestionsBySubjectAsync(s.id);
    qs.forEach(q => allByDifficulty[q.difficulty].push(q));
  }

  const picked = new Set<string>();
  const result: Question[] = [];

  const pickFrom = (pool: Question[], count: number) => {
    const shuffled = shuffle(pool.filter(q => !picked.has(q.id)));
    const take = shuffled.slice(0, count);
    take.forEach(q => { picked.add(q.id); result.push(q); });
    return take.length;
  };

  pickFrom(allByDifficulty.easy, MOCK_EASY);
  pickFrom(allByDifficulty.intermediate, MOCK_MEDIUM);
  pickFrom(allByDifficulty.hard, MOCK_HARD);

  // Random from remaining
  const remaining = [...allByDifficulty.easy, ...allByDifficulty.intermediate, ...allByDifficulty.hard].filter(q => !picked.has(q.id));
  pickFrom(remaining, MOCK_RANDOM);

  return shuffle(result);
}

const MockTest = () => {
  const navigate = useNavigate();
  const { user, unlockPremium } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);

  // Premium gate
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");

  const isPremium = user?.isPremium || user?.isAdmin;

  useEffect(() => {
    if (!isPremium) {
      setLoading(false);
      return;
    }
    buildMockTest().then(qs => {
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(null));
      setLoading(false);
    });
  }, [isPremium]);

  const totalTime = questions.length * SECONDS_PER_QUESTION;

  const finishQuiz = useCallback((finalAnswers: (number | null)[]) => {
    if (finished) return;
    setFinished(true);
    let correct = 0;
    finalAnswers.forEach((a, i) => {
      if (a === questions[i]?.correctAnswer) correct++;
    });
    const result = {
      subject: "Mock Test",
      correct,
      incorrect: questions.length - correct,
      total: questions.length,
      difficulty: "mixed",
      date: new Date().toISOString(),
      timed: true,
      isMock: true,
    };
    const history = JSON.parse(localStorage.getItem("mdcat_history") || "[]");
    const u = JSON.parse(localStorage.getItem("mdcat_user") || "{}");
    history.push({ ...result, username: u.username });
    localStorage.setItem("mdcat_history", JSON.stringify(history));
    navigate("/result", { state: { result, answers: finalAnswers, questions } });
  }, [finished, questions, navigate]);

  const handleTimeUp = useCallback(() => {
    const currentAnswers = [...answers];
    currentAnswers[current] = selected;
    finishQuiz(currentAnswers);
  }, [answers, current, selected, finishQuiz]);

  const { formatted, percentage, isLow, isCritical } = useQuizTimer({
    totalSeconds: totalTime,
    onTimeUp: handleTimeUp,
    enabled: isPremium === true && !finished && questions.length > 0,
  });

  const handleUnlock = () => {
    if (unlockPremium(unlockCode)) {
      toast.success("Premium unlocked! Loading mock test...");
      setShowUnlock(false);
      setLoading(true);
      buildMockTest().then(qs => {
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(null));
        setLoading(false);
      });
    } else {
      toast.error("Invalid code. Please try again.");
    }
  };

  // Premium gate UI
  if (!isPremium) {
    return (
      <div className="h-dvh bg-background flex flex-col">
        <div className="shrink-0 px-5 pt-12 pb-3 flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <X size={16} />
          </button>
          <h1 className="text-lg font-bold text-foreground">Mock Test</h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Crown size={36} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Premium Feature</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Mock tests with 50 MCQs across all subjects and difficulty levels are available for premium users only.
            </p>

            {showUnlock ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter unlock code"
                  value={unlockCode}
                  onChange={e => setUnlockCode(e.target.value)}
                  className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground text-center tracking-widest font-mono uppercase"
                  autoFocus
                />
                <button onClick={handleUnlock} disabled={!unlockCode.trim()}
                  className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-[0.97] transition-transform duration-100 disabled:opacity-40">
                  Unlock Premium
                </button>
                <button onClick={() => setShowUnlock(false)}
                  className="text-xs text-muted-foreground font-medium">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setShowUnlock(true)}
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-100">
                <Lock size={16} /> Enter Unlock Code
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-dvh bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Building mock test...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="h-dvh bg-background flex flex-col items-center justify-center px-6">
        <p className="text-lg font-semibold mb-2">Not enough questions</p>
        <p className="text-sm text-muted-foreground mb-4">Add more questions via the admin panel to enable mock tests.</p>
        <button onClick={() => navigate("/home")} className="btn-primary px-8">Go Back</button>
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

  // Count stats
  const easyCount = questions.filter(q => q.difficulty === "easy").length;
  const medCount = questions.filter(q => q.difficulty === "intermediate").length;
  const hardCount = questions.filter(q => q.difficulty === "hard").length;

  return (
    <div className="h-dvh bg-background flex flex-col">
      {/* Top Bar */}
      <div className="shrink-0 px-5 pt-12 pb-3 flex items-center gap-3">
        <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <X size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">Mock Test</p>
          <p className="text-[10px] text-muted-foreground">
            {easyCount}E · {medCount}M · {hardCount}H · Timed
          </p>
        </div>
        <div className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 border shrink-0 ${
          isCritical ? "bg-destructive/10 border-destructive/30 text-destructive"
            : isLow ? "bg-warning/10 border-warning/30 text-warning"
            : "bg-card border-border text-foreground"
        }`}>
          <Timer size={14} className={isCritical ? "text-destructive" : isLow ? "text-warning" : "text-primary"} />
          <span className="text-xs font-bold font-mono tabular-nums">{formatted}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="shrink-0 px-5 pb-4">
        <div className="space-y-1.5">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${
              isCritical ? "bg-destructive" : isLow ? "bg-warning" : "bg-primary"
            }`} style={{ width: `${percentage}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-1 bg-muted rounded-full overflow-hidden flex-1">
              <div className="h-full bg-primary/40 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground ml-2 tabular-nums">{current + 1}/{questions.length}</span>
          </div>
        </div>
      </div>

      {/* Question + Options */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5">
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.1 }}>
            {/* Subject + difficulty badge */}
            <div className="flex gap-1.5 mb-3">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                {subjects.find(s => s.id === q.subject)?.name || q.subject}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                q.difficulty === "easy" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : q.difficulty === "intermediate" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-red-500/15 text-red-600 dark:text-red-400"
              }`}>
                {q.difficulty}
              </span>
            </div>

            <div className="glass-card p-5 mb-5">
              <p className="text-base font-semibold leading-relaxed text-foreground">{q.question}</p>
            </div>

            <div className="space-y-3 pb-4">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                return (
                  <button key={i} className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-colors duration-100 text-left ${
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"
                  }`} onClick={() => setSelected(i)}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-100 ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>{optionLetters[i]}</div>
                    <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground/80"}`}>{opt}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Action Bar */}
      <div className="shrink-0 px-5 py-4 border-t border-border/50 bg-background" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}>
        <button onClick={handleNext} disabled={selected === null} className="btn-primary w-full disabled:opacity-40">
          {current === questions.length - 1 ? "Finish Mock Test" : "Next Question"}
        </button>
      </div>
    </div>
  );
};

export default MockTest;
