import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Search, X, Check, Crown, User as UserIcon, Eye, EyeOff, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { subjects } from "@/lib/quiz-data";
import { logActivity } from "@/lib/admin-activity";

interface StoredUser {
  username: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  isPremium?: boolean;
  createdAt?: number;
}

interface HistoryEntry {
  username?: string;
  subject?: string;
  correct: number;
  total: number;
  difficulty?: string;
  date: string;
  timed?: boolean;
}

const USERS_KEY = "mdcat_users";
const HISTORY_KEY = "mdcat_history";

function readUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
}
function writeUsers(u: StoredUser[]) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function readHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function writeHistory(h: HistoryEntry[]) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }

interface UserStats {
  attempts: number;
  totalCorrect: number;
  totalQuestions: number;
  accuracy: number;
  lastActive: number | null;
  bySubject: Record<string, { attempts: number; accuracy: number }>;
}

function computeStats(username: string, history: HistoryEntry[]): UserStats {
  const items = history.filter(h => h.username === username);
  const totalCorrect = items.reduce((a, h) => a + (h.correct || 0), 0);
  const totalQuestions = items.reduce((a, h) => a + (h.total || 0), 0);
  const lastActive = items.length ? Math.max(...items.map(h => new Date(h.date).getTime())) : null;
  const bySubject: Record<string, { attempts: number; accuracy: number }> = {};
  subjects.forEach(s => {
    const sh = items.filter(h => h.subject?.toLowerCase() === s.name?.toLowerCase() || h.subject === s.id);
    const t = sh.reduce((a, h) => a + h.total, 0);
    const c = sh.reduce((a, h) => a + h.correct, 0);
    bySubject[s.id] = { attempts: sh.length, accuracy: t > 0 ? Math.round((c / t) * 100) : 0 };
  });
  return {
    attempts: items.length,
    totalCorrect,
    totalQuestions,
    accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    lastActive,
    bySubject,
  };
}

interface Props { onBack: () => void; }

const emptyForm = { username: "", email: "", password: "", isPremium: false };

export default function AdminUsers({ onBack }: Props) {
  const [users, setUsers] = useState<StoredUser[]>(readUsers());
  const [history, setHistory] = useState<HistoryEntry[]>(readHistory());
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<string | null>(null);

  const reload = () => { setUsers(readUsers()); setHistory(readHistory()); };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u =>
      !q || u.username.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const overall = useMemo(() => {
    const total = users.length;
    const premium = users.filter(u => u.isPremium).length;
    const active = new Set(history.map(h => h.username).filter(Boolean)).size;
    const totalAttempts = history.length;
    const totalQ = history.reduce((a, h) => a + h.total, 0);
    const totalC = history.reduce((a, h) => a + h.correct, 0);
    const accuracy = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
    return { total, premium, active, totalAttempts, accuracy };
  }, [users, history]);

  const leaderboard = useMemo(() => {
    return users.map(u => {
      const s = computeStats(u.username, history);
      return { username: u.username, attempts: s.attempts, accuracy: s.accuracy };
    }).sort((a, b) => b.attempts - a.attempts || b.accuracy - a.accuracy).slice(0, 8);
  }, [users, history]);

  const resetForm = () => { setForm({ ...emptyForm }); setEditingUsername(null); setShowForm(false); setShowPassword(false); };

  const startEdit = (u: StoredUser) => {
    setForm({ username: u.username, email: u.email, password: u.password, isPremium: !!u.isPremium });
    setEditingUsername(u.username);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const username = form.username.trim();
    const email = form.email.trim();
    if (!username) { toast.error("Username is required"); return; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { toast.error("Valid email is required"); return; }
    if (!editingUsername && form.password.length < 6) { toast.error("Password must be at least 6 chars"); return; }
    if (editingUsername && form.password && form.password.length < 6) { toast.error("Password must be at least 6 chars"); return; }

    const all = readUsers();
    if (editingUsername) {
      const idx = all.findIndex(u => u.username === editingUsername);
      if (idx < 0) { toast.error("User not found"); return; }
      // username change collision
      if (username !== editingUsername && all.some(u => u.username === username)) {
        toast.error("Username already exists"); return;
      }
      const updated: StoredUser = {
        ...all[idx],
        username,
        email,
        password: form.password ? form.password : all[idx].password,
        isPremium: form.isPremium,
      };
      all[idx] = updated;
      writeUsers(all);
      // propagate username change through history
      if (username !== editingUsername) {
        const h = readHistory().map(x => x.username === editingUsername ? { ...x, username } : x);
        writeHistory(h);
      }
      logActivity("user_update", `Updated user "${editingUsername}"${username !== editingUsername ? ` → "${username}"` : ""}${form.password ? " (password reset)" : ""}${form.isPremium !== !!all[idx].isPremium ? "" : ""}`, { username });
      toast.success("User updated");
    } else {
      if (all.some(u => u.username === username)) { toast.error("Username already exists"); return; }
      const newUser: StoredUser = {
        username, email, password: form.password,
        isAdmin: false, isPremium: form.isPremium, createdAt: Date.now(),
      };
      all.push(newUser);
      writeUsers(all);
      logActivity("user_create", `Created user "${username}"${form.isPremium ? " (premium)" : ""}`, { username, premium: form.isPremium });
      toast.success("User created");
    }
    resetForm();
    reload();
  };

  const handleDelete = (username: string) => {
    const all = readUsers().filter(u => u.username !== username);
    writeUsers(all);
    const h = readHistory().filter(x => x.username !== username);
    writeHistory(h);
    setDeleteConfirm(null);
    if (detailUser === username) setDetailUser(null);
    logActivity("user_delete", `Deleted user "${username}"`, { username });
    toast.success("User deleted");
    reload();
  };

  // ─── Detail view ───
  if (detailUser) {
    const u = users.find(x => x.username === detailUser);
    if (!u) { setDetailUser(null); return null; }
    const stats = computeStats(u.username, history);
    const subjectChart = subjects.map(s => ({
      name: s.name.split(" ")[0],
      accuracy: stats.bySubject[s.id]?.accuracy || 0,
      attempts: stats.bySubject[s.id]?.attempts || 0,
    }));
    const recent = history.filter(h => h.username === u.username).slice(-10).reverse();

    return (
      <div className="h-dvh flex flex-col bg-background">
        <div className="bg-primary px-4 pt-8 pb-4 shrink-0" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setDetailUser(null)} className="text-primary-foreground"><ArrowLeft size={22} /></button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-primary-foreground truncate">{u.username}</h1>
              <p className="text-primary-foreground/60 text-xs truncate">{u.email}</p>
            </div>
            {u.isPremium && <span className="bg-primary-foreground/20 text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Crown size={10} /> PREMIUM</span>}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: "Quizzes", value: stats.attempts },
              { label: "Accuracy", value: `${stats.accuracy}%` },
              { label: "Correct", value: `${stats.totalCorrect}/${stats.totalQuestions}` },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-2.5 text-center bg-primary-foreground/10 text-primary-foreground">
                <p className="text-base font-extrabold">{s.value}</p>
                <p className="text-[9px] font-semibold opacity-70 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="border border-border rounded-2xl p-4 bg-card">
            <h3 className="text-sm font-bold text-foreground mb-3">Subject Performance</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChart} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number, n: string) => [n === "accuracy" ? `${v}%` : v, n === "accuracy" ? "Accuracy" : "Attempts"]}
                  />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-border rounded-2xl p-4 bg-card">
            <h3 className="text-sm font-bold text-foreground mb-3">Recent Activity</h3>
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground">No quiz attempts yet</p>
            ) : (
              <div className="space-y-2">
                {recent.map((h, i) => {
                  const acc = h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{h.subject}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(h.date).toLocaleDateString()} · {h.difficulty || "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-foreground">{h.correct}/{h.total}</p>
                        <p className="text-[10px] text-muted-foreground">{acc}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button onClick={() => startEdit(u)} className="w-full h-11 bg-primary text-primary-foreground rounded-xl text-sm font-bold">
            Edit User
          </button>
        </div>
      </div>
    );
  }

  // ─── List view ───
  return (
    <div className="h-dvh flex flex-col bg-background">
      <div className="bg-primary px-4 pt-8 pb-5 shrink-0" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-primary-foreground"><ArrowLeft size={22} /></button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-primary-foreground">User Management</h1>
            <p className="text-primary-foreground/60 text-xs">Create, update, delete & track users</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "Total", value: overall.total },
            { label: "Active", value: overall.active },
            { label: "Premium", value: overall.premium },
            { label: "Avg Acc", value: `${overall.accuracy}%` },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2.5 text-center bg-primary-foreground/10 text-primary-foreground">
              <p className="text-lg font-extrabold">{s.value}</p>
              <p className="text-[9px] font-semibold opacity-70 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-8 space-y-4">
        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform duration-100">
            {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? "Cancel" : "New User"}
          </button>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form onSubmit={handleSubmit}
              className="border border-border rounded-2xl p-4 space-y-3 bg-card"
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}>
              <h3 className="text-sm font-bold text-foreground">{editingUsername ? `Edit: ${editingUsername}` : "New User"}</h3>
              <input type="text" placeholder="Username" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground" />
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground" />
              <div className="relative">
                <input type={showPassword ? "text" : "password"}
                  placeholder={editingUsername ? "New password (leave empty to keep)" : "Password (min 6 chars)"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <input type="checkbox" checked={form.isPremium}
                  onChange={e => setForm({ ...form, isPremium: e.target.checked })}
                  className="w-4 h-4 accent-primary" />
                Premium access
              </label>
              <button type="submit" className="w-full h-10 bg-primary text-primary-foreground rounded-xl text-sm font-bold">
                {editingUsername ? "Update User" : "Create User"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Leaderboard chart */}
        {leaderboard.length > 0 && leaderboard.some(l => l.attempts > 0) && (
          <div className="border border-border rounded-2xl p-4 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Top Performers (by attempts)</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderboard} layout="vertical" barSize={16} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="username" type="category" width={70}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number, n: string) => [n === "accuracy" ? `${v}%` : v, n === "accuracy" ? "Accuracy" : "Attempts"]}
                  />
                  <Bar dataKey="attempts" radius={[0, 6, 6, 0]}>
                    {leaderboard.map((_, i) => <Cell key={i} fill="hsl(var(--primary))" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full h-10 rounded-xl border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 text-muted-foreground"><X size={16} /></button>}
        </div>

        <p className="text-xs text-muted-foreground font-semibold">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon size={36} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground text-sm">No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => {
              const stats = computeStats(u.username, history);
              return (
                <div key={u.username} className="border border-border rounded-xl p-3 bg-card">
                  <div className="flex items-start gap-3">
                    <button onClick={() => setDetailUser(u.username)}
                      className="flex-1 min-w-0 text-left active:opacity-70">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground truncate">{u.username}</p>
                        {u.isPremium && <Crown size={12} className="text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span><b className="text-foreground">{stats.attempts}</b> quizzes</span>
                        <span><b className="text-foreground">{stats.accuracy}%</b> acc</span>
                        {stats.lastActive && (
                          <span>Active {new Date(stats.lastActive).toLocaleDateString()}</span>
                        )}
                      </div>
                    </button>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(u)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary active:scale-90 transition-transform duration-100">
                        <Pencil size={13} />
                      </button>
                      {deleteConfirm === u.username ? (
                        <>
                          <button onClick={() => handleDelete(u.username)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-destructive text-destructive-foreground active:scale-90 transition-transform duration-100">
                            <Check size={13} />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground active:scale-90 transition-transform duration-100">
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setDeleteConfirm(u.username)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive active:scale-90 transition-transform duration-100">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
