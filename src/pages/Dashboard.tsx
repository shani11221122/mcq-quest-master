import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { subjects } from "@/lib/quiz-data";
import CircularProgress from "@/components/CircularProgress";
import PageShell from "@/components/PageShell";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const history = JSON.parse(localStorage.getItem("mdcat_history") || "[]")
    .filter((h: any) => h.username === user?.username);

  const totalCorrect = history.reduce((a: number, h: any) => a + h.correct, 0);
  const totalQ = history.reduce((a: number, h: any) => a + h.total, 0);
  const overallAcc = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

  const subjectData = subjects.map((s) => {
    const sh = history.filter((h: any) => h.subject?.toLowerCase() === s.name.toLowerCase() || h.subject === s.id);
    const c = sh.reduce((a: number, h: any) => a + h.correct, 0);
    const t = sh.reduce((a: number, h: any) => a + h.total, 0);
    return { name: s.name.slice(0, 7), accuracy: t > 0 ? Math.round((c / t) * 100) : 0, attempts: sh.length };
  });

  const timeData = history.slice(-7).map((h: any, i: number) => ({
    quiz: `Q${i + 1}`,
    score: h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0,
  }));

  return (
    <PageShell>
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold font-display">Performance</h1>
        </div>
      </div>

      <div className="px-5 space-y-5 pb-4">
        <div className="glass-card p-6 flex items-center gap-6">
          <CircularProgress value={overallAcc} max={100} size={100} strokeWidth={8} />
          <div>
            <p className="text-sm font-bold font-display text-foreground">Overall Accuracy</p>
            <p className="text-xs text-muted-foreground mt-0.5">{history.length} quizzes taken</p>
            <p className="text-xs text-muted-foreground">{totalCorrect}/{totalQ} correct answers</p>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-bold font-display text-foreground mb-4">Subject Performance</h3>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Take quizzes to see data</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={subjectData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [`${value}%`, "Accuracy"]} />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-bold font-display text-foreground mb-4">Improvement Trend</h3>
          {timeData.length < 2 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Need more quizzes to show trend</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={timeData}>
                <XAxis dataKey="quiz" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [`${value}%`, "Score"]} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--success))" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default Dashboard;
