import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Circle, Clock, TrendingUp } from "lucide-react";
import { getPresence, isOnline, type PresenceRecord, ONLINE_WINDOW_MS } from "@/lib/presence";

interface HistoryEntry {
  username: string;
  subject: string;
  correct: number;
  total: number;
  date: string;
}

function formatAgo(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function userStats(username: string, history: HistoryEntry[]) {
  const items = history.filter(h => h.username === username);
  const attempts = items.length;
  const correct = items.reduce((a, h) => a + (h.correct || 0), 0);
  const total = items.reduce((a, h) => a + (h.total || 0), 0);
  return { attempts, accuracy: total ? Math.round((correct / total) * 100) : 0 };
}

const AdminMonitoring = () => {
  const [presence, setPresence] = useState<PresenceRecord[]>([]);
  const [now, setNow] = useState(Date.now());
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const refresh = () => {
      setPresence(getPresence());
      setNow(Date.now());
      try { setHistory(JSON.parse(localStorage.getItem("mdcat_history") || "[]")); } catch { setHistory([]); }
    };
    refresh();
    const id = window.setInterval(refresh, 3000);
    const onEvt = () => refresh();
    window.addEventListener("mdcat-presence", onEvt);
    window.addEventListener("storage", onEvt);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("mdcat-presence", onEvt);
      window.removeEventListener("storage", onEvt);
    };
  }, []);

  const online = presence.filter(isOnline);
  const offline = presence.filter(p => !isOnline(p));

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-border rounded-2xl p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Circle size={10} className="fill-emerald-500 text-emerald-500" /> Online now
          </div>
          <p className="text-2xl font-bold text-foreground">{online.length}</p>
        </div>
        <div className="border border-border rounded-2xl p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Activity size={12} /> Tracked (24h)
          </div>
          <p className="text-2xl font-bold text-foreground">{presence.length}</p>
        </div>
        <div className="border border-border rounded-2xl p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <TrendingUp size={12} /> Total attempts
          </div>
          <p className="text-2xl font-bold text-foreground">{history.length}</p>
        </div>
      </div>

      {/* Online list */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Online users</h3>
          <span className="text-[10px] text-muted-foreground">refreshes every 3s</span>
        </div>
        {online.length === 0 ? (
          <p className="text-xs text-muted-foreground px-4 py-6 text-center">No users online right now.</p>
        ) : (
          <ul className="divide-y divide-border">
            {online.map(p => {
              const s = userStats(p.username, history);
              return (
                <motion.li
                  key={p.username}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 flex items-center gap-3"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.username}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {p.activity} · {formatAgo(now - p.lastSeen)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{s.accuracy}%</p>
                    <p className="text-[10px] text-muted-foreground">{s.attempts} attempts</p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Offline / recent */}
      {offline.length > 0 && (
        <div className="border border-border rounded-2xl bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Recently active</h3>
          </div>
          <ul className="divide-y divide-border">
            {offline.slice(0, 10).map(p => {
              const s = userStats(p.username, history);
              return (
                <li key={p.username} className="px-4 py-3 flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.username}</p>
                    <p className="text-[11px] text-muted-foreground truncate">Last seen {formatAgo(now - p.lastSeen)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{s.accuracy}%</p>
                    <p className="text-[10px] text-muted-foreground">{s.attempts} attempts</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Online window: {Math.round(ONLINE_WINDOW_MS / 1000)}s · No passwords or sensitive info displayed.
      </p>
    </div>
  );
};

export default AdminMonitoring;
