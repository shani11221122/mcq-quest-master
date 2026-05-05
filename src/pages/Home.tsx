import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { BookOpen, ClipboardCheck, Trophy, Target, Flame, ChevronRight, Crown, Shield } from "lucide-react";
import PageShell from "@/components/PageShell";
import logo from "@/assets/logo.jpeg";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const history = JSON.parse(localStorage.getItem("mdcat_history") || "[]")
    .filter((h: any) => h.username === user?.username);

  const totalQuizzes = history.length;
  const totalCorrect = history.reduce((acc: number, h: any) => acc + h.correct, 0);
  const totalQuestions = history.reduce((acc: number, h: any) => acc + h.total, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const streak = (() => {
    if (history.length === 0) return 0;
    const dates = [...new Set(history.map((h: any) => new Date(h.date).toDateString() as string))].sort(
      (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime()
    );
    let count = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i] as string);
      const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === i || (i === 0 && diff <= 1)) count++;
      else break;
    }
    return count;
  })();

  const stats = [
    { icon: Trophy, label: "Quizzes", value: totalQuizzes, color: "text-primary" },
    { icon: Target, label: "Accuracy", value: `${accuracy}%`, color: "text-success" },
    { icon: Flame, label: "Streak", value: streak, color: "text-warning" },
  ];

  const isPremium = user?.isPremium || user?.isAdmin;

  const quickActions = [
    { icon: BookOpen, label: "Start Quiz", desc: "Practice by subject", route: "/quiz", gradient: "from-primary/10 to-primary/5", premium: false },
    { icon: ClipboardCheck, label: "Mock Test", desc: isPremium ? "50 MCQs · Timed" : "Premium · 50 MCQs", route: "/mock-test", gradient: "from-success/10 to-success/5", premium: !isPremium },
  ];

  return (
    <PageShell>
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-foreground)/0.08),transparent_50%)]" />

        <div className="relative px-5 pt-12 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-10 rounded-xl bg-primary-foreground/10 backdrop-blur-sm px-2 py-1 flex items-center justify-center shrink-0">
                <img src={logo} alt="MDCAT Smart Prep" className="h-full w-auto max-w-[140px] object-contain" />
              </div>
            </div>
            {user?.isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="bg-primary-foreground/15 text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5"
              >
                <Shield size={14} />
                Admin
              </button>
            )}
          </div>

          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12 }}>
            <p className="text-primary-foreground/70 text-sm font-medium">Welcome back</p>
            <h1 className="text-2xl font-bold font-display text-primary-foreground mt-0.5">
              {user?.username || "Student"} 👋
            </h1>
          </motion.div>

          <motion.div
            className="flex gap-3 mt-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, delay: 0.04 }}
          >
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex-1 bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <Icon size={18} className="text-primary-foreground/80 mx-auto mb-1" />
                  <p className="text-xl font-bold font-display text-primary-foreground">{s.value}</p>
                  <p className="text-[10px] font-medium text-primary-foreground/60 uppercase tracking-wider">{s.label}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 -mt-3">
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12, delay: 0.06 }}
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className={`glass-card p-4 text-left bg-gradient-to-br ${action.gradient} active:scale-[0.97] transition-transform duration-100 relative overflow-hidden`}
                onClick={() => navigate(action.route)}
              >
                {action.premium && (
                  <div className="absolute top-2 right-2">
                    <Crown size={14} className="text-primary" />
                  </div>
                )}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Icon size={20} className="text-primary" />
                </div>
                <p className="font-semibold text-sm text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="px-5 mt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold font-display text-foreground">Recent Activity</h2>
          <button onClick={() => navigate("/history")} className="text-xs text-primary font-semibold flex items-center gap-0.5">
            View all <ChevronRight size={14} />
          </button>
        </div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12, delay: 0.08 }}
        >
          {history.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <p className="text-muted-foreground text-sm">No quizzes taken yet</p>
              <button onClick={() => navigate("/quiz")} className="text-primary text-sm font-semibold mt-2">
                Take your first quiz →
              </button>
            </div>
          ) : (
            history.slice(-3).reverse().map((h: any, i: number) => {
              const pct = h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0;
              return (
                <div key={i} className="glass-card p-3.5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                    pct >= 70 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    {pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground capitalize truncate">{h.subject}</p>
                    <p className="text-xs text-muted-foreground">{h.correct}/{h.total} correct</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    h.difficulty === "easy"
                      ? "bg-success/10 text-success"
                      : h.difficulty === "intermediate"
                      ? "bg-warning/10 text-warning"
                      : h.difficulty === "hard"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}>{h.difficulty === "intermediate" ? "Medium" : h.difficulty}</span>
                </div>
              );
            })
          )}
        </motion.div>
      </div>
    </PageShell>
  );
};

export default Home;
