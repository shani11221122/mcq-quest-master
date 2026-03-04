import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const rules = [
  "Each quiz contains 10 MCQs from the selected subject.",
  "You can filter questions by difficulty: Easy, Intermediate, or Hard.",
  "Select one answer per question before clicking Next.",
  "You cannot go back to previous questions.",
  "Results are shown at the end with correct/incorrect breakdown.",
  "Your quiz history is saved automatically.",
  "There is no negative marking.",
  "Each correct answer earns 1 point.",
];

const Rules = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button onClick={() => navigate("/home")}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-extrabold">Rules</h1>
      </div>

      <div className="px-6 pb-8 space-y-4">
        {rules.map((r, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p className="font-semibold text-foreground/90">{r}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rules;
