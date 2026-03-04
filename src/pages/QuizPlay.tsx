import { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestionsBySubject, subjects, type Difficulty } from "@/lib/quiz-data";

const QuizPlay = () => {
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const difficulty = searchParams.get("difficulty") as Difficulty | null;

  const questions = useMemo(() => {
    return getQuestionsBySubject(subjectId || "", difficulty || undefined);
  }, [subjectId, difficulty]);

  const subject = subjects.find(s => s.id === subjectId);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <p className="text-xl font-bold mb-4">No questions available for this difficulty level.</p>
        <button onClick={() => navigate("/quiz")} className="btn-primary px-8">
          Go Back
        </button>
      </div>
    );
  }

  const q = questions[current];

  const handleNext = () => {
    const newAnswers = [...answers];
    newAnswers[current] = selected;
    setAnswers(newAnswers);

    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setSelected(newAnswers[current + 1]);
    } else {
      // Calculate results
      let correct = 0;
      newAnswers.forEach((a, i) => {
        if (a === questions[i].correctAnswer) correct++;
      });
      const result = {
        subject: subject?.name || subjectId,
        correct,
        incorrect: questions.length - correct,
        total: questions.length,
        difficulty: difficulty || "all",
        date: new Date().toISOString(),
      };
      // Save to history
      const history = JSON.parse(localStorage.getItem("mdcat_history") || "[]");
      const user = JSON.parse(localStorage.getItem("mdcat_user") || "{}");
      history.push({ ...result, username: user.username });
      localStorage.setItem("mdcat_history", JSON.stringify(history));

      navigate("/result", { state: { result, answers: newAnswers, questions } });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-6 pb-2">
        <button onClick={() => navigate("/quiz")}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-extrabold">{subject?.name || "Quiz"}</h1>
        {difficulty && (
          <span className="ml-auto text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full capitalize">
            {difficulty}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="px-6 py-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">{current + 1} / {questions.length}</p>
      </div>

      <div className="flex-1 px-6 py-4 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex-1 flex flex-col"
          >
            <p className="text-lg font-bold mb-6 leading-relaxed">{q.question}</p>

            <div className="space-y-3 flex-1">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  className={`option-card w-full text-left ${selected === i ? "option-card-selected" : ""}`}
                  onClick={() => setSelected(i)}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected === i ? "border-primary" : "border-muted-foreground/30"
                  }`}>
                    {selected === i && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </div>
                  <span className="font-semibold">{opt}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={handleNext}
          disabled={selected === null}
          className="btn-primary w-full mt-6 disabled:opacity-50"
        >
          {current === questions.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default QuizPlay;
