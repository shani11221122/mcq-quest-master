import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Timer, Lock, Crown, Save, PlayCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestionsBySubjectAsync, subjects, type Difficulty, type Question } from "@/lib/quiz-data";
import { useQuizTimer } from "@/hooks/use-quiz-timer";
import { useAuth } from "@/lib/auth-context";
import { saveMockProgress, getMockProgress, deleteMockProgress, type MockProgress } from "@/lib/indexeddb";
import { toast } from "sonner";

const optionLetters = ["A", "B", "C", "D"];
const MOCK_TOTAL = 50;
const MOCK_EASY = 10;
const MOCK_MEDIUM = 10;
const MOCK_HARD = 10;
const MOCK_RANDOM = MOCK_TOTAL - MOCK_EASY - MOCK_MEDIUM - MOCK_HARD;
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
  const allByDifficulty: Record<Difficulty, Question[]> = { easy: [], intermediate: [], hard: [] };
  for (const s of subjects) {
    const qs = await getQuestionsBySubjectAsync(s.id);
    qs.forEach(q => allByDifficulty[q.difficulty].push(q));
  }
  const picked = new Set<string>();
  const result: Question[] = [];
  const pickFrom = (pool: Question[], count: number) => {
    const shuffled = shuffle(pool.filter(q => !picked.has(q.id)));
    shuffled.slice(0, count).forEach(q => { picked.add(q.id); result.push(q); });
  };
  pickFrom(allByDifficulty.easy, MOCK_EASY);
  pickFrom(allByDifficulty.intermediate, MOCK_MEDIUM);
  pickFrom(allByDifficulty.hard, MOCK_HARD);
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
  const [savedProgress, setSavedProgress] = useState<MockProgress | null>(null);
  const [showResume, setShowResume] = useState(false);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState<number | undefined>(undefined);

  // Premium gate
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");

  const isPremium = user?.isPremium || user?.isAdmin;
  const username = user?.username || "";

  // Check for saved progress on mount
  useEffect(() => {
    if (!isPremium) { setLoading(false); return; }
    (async () => {
      const progress = await getMockProgress(username);
      if (progress && progress.questions.length > 0) {
        setSavedProgress(progress);
        setShowResume(true);
        setLoading(false);
      } else {
        startNewTest();
      }
    })();
  }, [isPremium, username]);

  const startNewTest = async () => {
    setLoading(true);
    setShowResume(false);
    setSavedProgress(null);
    const qs = await buildMockTest();
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrent(0);
    setSelected(null);
    setInitialTimerSeconds(undefined);
    setFinished(false);
    await deleteMockProgress(username);
    setLoading(false);
  };

  const resumeTest = () => {
    if (!savedProgress) return;
    setQuestions(savedProgress.questions);
    setAnswers(savedProgress.answers);
    setCurrent(savedProgress.currentIndex);
    setSelected(savedProgress.answers[savedProgress.currentIndex]);
    setInitialTimerSeconds(savedProgress.secondsLeft);
    setShowResume(false);
    setFinished(false);
  };

  const totalTime = questions.length * SECONDS_PER_QUESTION;
  const secondsLeftRef = useRef(totalTime);

  const saveProgress = useCallback(async () => {
    if (finished || questions.length === 0) return;
    const currentAnswers = [...answers];
    currentAnswers[current] = selected;
    await saveMockProgress({
      username,
      questions,
      answers: currentAnswers,
      currentIndex: current,
      secondsLeft: secondsLeftRef.current,
      savedAt: Date.now(),
    });
    toast.success("Progress saved! You can continue later.");
  }, [finished, questions, answers, current, selected, username]);

  const finishQuiz = useCallback(async (finalAnswers: (number | null)[]) => {
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
    await deleteMockProgress(username);
    navigate("/result", { state: { result, answers: finalAnswers, questions } });
  }, [finished, questions, navigate, username]);

  const handleTimeUp = useCallback(() => {
    const currentAnswers = [...answers];
    currentAnswers[current] = selected;
    finishQuiz(currentAnswers);
  }, [answers, current, selected, finishQuiz]);

  const handleTick = useCallback((s: number) => {
    secondsLeftRef.current = s;
  }, []);

  const { formatted, percentage, isLow, isCritical } = useQuizTimer({
    totalSeconds: totalTime,
    initialSeconds: initialTimerSeconds,
    onTimeUp: handleTimeUp,
    onTick: handleTick,
    enabled: isPremium === true && !finished && questions.length > 0 && !showResume,
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isPremium || finished || questions.length === 0 || showResume) return;
    const interval = setInterval(() => {
      const currentAnswers = [...answers];
      currentAnswers[current] = selected;
      saveMockProgress({
        username,
        questions,
        answers: currentAnswers,
        currentIndex: current,
        secondsLeft: secondsLeftRef.current,
        savedAt: Date.now(),
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [isPremium, finished, questions, answers, current, selected, username, showResume]);

  const handleUnlock = () => {
    if (unlockPremium(unlockCode)) {
      toast.success("Premium unlocked! Loading mock test...");
      setShowUnlock(false);
      startNewTest();
    } else {
      toast.error("Invalid code. Please try again.");
    }
  };

  const handleExit = async () => {
    if (questions.length > 0 && !finished) {
      await saveProgress();
    }
    navigate("/home");
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
                <input type="text" placeholder="Enter unlock code" value={unlockCode}
                  onChange={e => setUnlockCode(e.target.value)}
                  className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground text-center tracking-widest font-mono uppercase"
                  autoFocus />
                <button onClick={handleUnlock} disabled={!unlockCode.trim()}
                  className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-[0.97] transition-transform duration-100 disabled:opacity-40">
                  Unlock Premium
                </button>
                <button onClick={() => setShowUnlock(false)} className="text-xs text-muted-foreground font-medium">Cancel</button>
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

  // Resume dialog
  if (showResume && savedProgress) {
    const answeredCount = savedProgress.answers.filter(a => a !== null).length;
    const timeLeft = Math.floor(savedProgress.secondsLeft / 60);
    const savedDate = new Date(savedProgress.savedAt);
    const timeAgo = getTimeAgo(savedDate);

    return (
      <div className="h-dvh bg-background flex flex-col">
        <div className="shrink-0 px-5 pt-12 pb-3 flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <X size={16} />
          </button>
          <h1 className="text-lg font-bold text-foreground">Mock Test</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm w-full">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Save size={36} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Saved Progress Found</h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              You have an unfinished mock test from {timeAgo}.
            </p>

            <div className="glass-card p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Answered</span>
                <span className="font-semibold text-foreground">{answeredCount}/{savedProgress.questions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Question</span>
                <span className="font-semibold text-foreground">#{savedProgress.currentIndex + 1}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time Remaining</span>
                <span className="font-semibold text-foreground">~{timeLeft} min</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(answeredCount / savedProgress.questions.length) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={resumeTest}
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-100">
                <PlayCircle size={18} /> Continue Test
              </button>
              <button onClick={startNewTest}
                className="w-full h-12 bg-secondary text-secondary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-100">
                <Trash2 size={16} /> Start Fresh
              </button>
            </div>
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

  const easyCount = questions.filter(q => q.difficulty === "easy").length;
  const medCount = questions.filter(q => q.difficulty === "intermediate").length;
  const hardCount = questions.filter(q => q.difficulty === "hard").length;

  return (
    <div className="h-dvh bg-background flex flex-col">
      {/* Top Bar */}
      <div className="shrink-0 px-5 pt-12 pb-3 flex items-center gap-3">
        <button onClick={handleExit} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <X size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">Mock Test</p>
          <p className="text-[10px] text-muted-foreground">
            {easyCount}E · {medCount}M · {hardCount}H · Timed
          </p>
        </div>
        <button onClick={saveProgress}
          className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center active:scale-90 transition-transform duration-100"
          title="Save progress">
          <Save size={15} className="text-primary" />
        </button>
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
            <div className="flex gap-1.5 mb-3">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                {subjects.find(s => s.id === q.subject)?.name || q.subject}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                q.difficulty === "easy" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : q.difficulty === "intermediate" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-red-500/15 text-red-600 dark:text-red-400"
              }`}>{q.difficulty}</span>
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

function getTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default MockTest;
