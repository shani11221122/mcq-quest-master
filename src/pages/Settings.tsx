import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Sun, Monitor, LogOut, KeyRound, ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import PageShell from "@/components/PageShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const themeOptions = [
  { key: "light" as const, label: "Light", icon: Sun },
  { key: "dark" as const, label: "Dark", icon: Moon },
  { key: "system" as const, label: "System", icon: Monitor },
];

const rules = [
  "Each quiz contains 10 MCQs from the selected subject.",
  "Filter questions by difficulty: Easy, Intermediate, or Hard.",
  "Select one answer per question before clicking Next.",
  "You cannot go back to previous questions.",
  "Results are shown at the end with correct/incorrect breakdown.",
  "Your quiz history is saved automatically.",
  "No negative marking. Each correct answer earns 1 point.",
  "Timed mode gives 1 minute per question.",
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();

  const [pwOpen, setPwOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetPwForm = () => {
    setCurrent(""); setNext(""); setConfirm("");
    setShowCurrent(false); setShowNext(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangePassword = async () => {
    if (!current || !next || !confirm) {
      toast.error("Please fill all fields");
      return;
    }
    if (next !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setSubmitting(true);
    // simulate API latency for UX
    await new Promise((r) => setTimeout(r, 400));
    const res = changePassword(current, next);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error || "Failed to change password");
      return;
    }
    toast.success("Password updated successfully");
    resetPwForm();
    setPwOpen(false);
  };

  return (
    <PageShell>
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/home")} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold font-display">Settings</h1>
        </div>

        <div className="glass-card p-4 flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary">{user?.username?.charAt(0).toUpperCase() || "S"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{user?.username || "Student"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Appearance</h2>
          <div className="glass-card p-1.5 flex gap-1">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = theme === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-100 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={14} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Account</h2>
          <div className="glass-card overflow-hidden divide-y divide-border/50">
            <button onClick={() => setPwOpen(true)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors duration-100">
              <KeyRound size={18} className="text-muted-foreground" />
              <span className="flex-1 text-left text-sm font-medium text-foreground">Change Password</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors duration-100">
              <LogOut size={18} className="text-destructive" />
              <span className="flex-1 text-left text-sm font-medium text-destructive">Log Out</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Quiz Rules</h2>
          <div className="glass-card p-4 space-y-3">
            {rules.map((r, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/80 leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={pwOpen} onOpenChange={(o) => { setPwOpen(o); if (!o) resetPwForm(); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one. Min 8 characters with letters and numbers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="Current password"
                className="w-full h-11 px-4 pr-10 rounded-xl bg-muted border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="New password"
                className="w-full h-11 px-4 pr-10 rounded-xl bg-muted border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNext(!showNext)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <input
              type={showNext ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full h-11 px-4 rounded-xl bg-muted border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              autoComplete="new-password"
            />
          </div>

          <DialogFooter className="flex-row gap-2">
            <button
              onClick={() => setPwOpen(false)}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-muted text-sm font-semibold text-foreground hover:bg-muted/70 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Update
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default Settings;
