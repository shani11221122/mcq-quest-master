import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import PageShell from "@/components/PageShell";

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const history = JSON.parse(localStorage.getItem("mdcat_history") || "[]")
    .filter((h: any) => h.username === user?.username)
    .reverse();

  return (
    <PageShell>
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold font-display">History</h1>
        </div>
      </div>

      <div className="px-5 pb-4">
        {history.length === 0 ? (
          <div className="glass-card p-8 text-center mt-8">
            <Clock size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">No quiz history yet</p>
            <button onClick={() => navigate("/quiz")} className="text-primary text-sm font-semibold mt-3">
              Take your first quiz →
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((h: any, i: number) => {
              const pct = h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0;
              return (
                <div key={i} className="glass-card p-4 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    pct >= 70 ? "bg-success/10 text-success" : pct >= 40 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                  }`}>
                    {pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground capitalize truncate">{h.subject}</p>
                    <p className="text-xs text-muted-foreground">{h.correct}/{h.total} correct • {new Date(h.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    h.difficulty === "easy"
                      ? "bg-success/10 text-success"
                      : h.difficulty === "intermediate"
                      ? "bg-warning/10 text-warning"
                      : h.difficulty === "hard"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {h.difficulty === "intermediate" ? "Medium" : h.difficulty}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default History;
