import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const history = JSON.parse(localStorage.getItem("mdcat_history") || "[]")
    .filter((h: any) => h.username === user?.username)
    .reverse();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button onClick={() => navigate("/home")}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-extrabold">History</h1>
      </div>

      <div className="px-6 pb-8">
        {history.length === 0 ? (
          <p className="text-muted-foreground text-center mt-12">No quiz history yet. Start a quiz!</p>
        ) : (
          <div className="space-y-4">
            {history.map((h: any, i: number) => (
              <div key={i} className="border border-border rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-primary">{h.subject}</span>
                  <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded-full">{h.difficulty}</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <span className="text-success font-bold">{h.correct} correct</span>
                  <span className="text-destructive font-bold">{h.incorrect} wrong</span>
                  <span className="text-muted-foreground">/ {h.total}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{new Date(h.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
