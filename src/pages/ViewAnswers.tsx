import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";

const ViewAnswers = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { answers, questions } = location.state || {};

  if (!answers || !questions) {
    navigate("/home");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-extrabold">Answers Review</h1>
      </div>

      <div className="px-6 pb-8 space-y-6">
        {questions.map((q: any, i: number) => {
          const isCorrect = answers[i] === q.correctAnswer;
          return (
            <div key={q.id} className="border border-border rounded-2xl p-4">
              <p className="font-bold mb-3">
                <span className="text-muted-foreground mr-2">Q{i + 1}.</span>
                {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt: string, j: number) => {
                  const isSelected = answers[i] === j;
                  const isAnswer = q.correctAnswer === j;
                  return (
                    <div
                      key={j}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
                        isAnswer ? "bg-success/10 text-success" : isSelected && !isAnswer ? "bg-destructive/10 text-destructive" : ""
                      }`}
                    >
                      {isAnswer && <Check size={16} />}
                      {isSelected && !isAnswer && <X size={16} />}
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
  );
};

export default ViewAnswers;
