import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";

const optionLetters = ["A", "B", "C", "D"];

const ViewAnswers = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { answers, questions } = location.state || {};

  if (!answers || !questions) {
    navigate("/home");
    return null;
  }

  return (
    <div className="h-dvh flex flex-col bg-background">
      <div className="shrink-0 px-5 pt-12 pb-4 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold font-display">Answers Review</h1>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="px-5 py-4 space-y-4 pb-8">
          {questions.map((q: any, i: number) => {
            const isCorrect = answers[i] === q.correctAnswer;
            return (
              <div key={q.id} className="glass-card p-4">
                <div className="flex items-start gap-2 mb-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    {isCorrect ? <Check size={14} /> : <X size={14} />}
                  </span>
                  <p className="font-semibold text-sm text-foreground leading-relaxed">{q.question}</p>
                </div>
                <div className="space-y-1.5 ml-8">
                  {q.options.map((opt: string, j: number) => {
                    const isSelected = answers[i] === j;
                    const isAnswer = q.correctAnswer === j;
                    return (
                      <div
                        key={j}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                          isAnswer
                            ? "bg-success/10 text-success"
                            : isSelected && !isAnswer
                            ? "bg-destructive/10 text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span className="font-bold">{optionLetters[j]}.</span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ViewAnswers;
