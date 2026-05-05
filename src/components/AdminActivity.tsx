import { useEffect, useMemo, useState } from "react";
import { Activity, Trash2, Plus, Pencil, Upload, Download, Database, KeyRound, UserCog, Users, FileJson, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  readActivity, subscribeActivity, clearActivity, actionLabels,
  type AdminActivityEntry, type AdminActionType,
} from "@/lib/admin-activity";

const iconMap: Record<AdminActionType, typeof Plus> = {
  mcq_add: Plus,
  mcq_update: Pencil,
  mcq_delete: Trash2,
  mcq_bulk_add: Layers,
  mcq_import: Upload,
  mcq_export: Download,
  mcq_seed: Database,
  user_create: Users,
  user_update: UserCog,
  user_delete: Trash2,
  premium_code_update: KeyRound,
  admin_credentials_update: UserCog,
};

const colorMap: Record<AdminActionType, string> = {
  mcq_add: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  mcq_update: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  mcq_delete: "bg-red-500/15 text-red-600 dark:text-red-400",
  mcq_bulk_add: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  mcq_import: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  mcq_export: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  mcq_seed: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  user_create: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  user_update: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  user_delete: "bg-red-500/15 text-red-600 dark:text-red-400",
  premium_code_update: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  admin_credentials_update: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface Props {
  limit?: number;
  showHeader?: boolean;
  showClear?: boolean;
}

export default function AdminActivity({ limit, showHeader = true, showClear = true }: Props) {
  const [entries, setEntries] = useState<AdminActivityEntry[]>(() => readActivity());
  const [filter, setFilter] = useState<"all" | "mcq" | "user" | "system">("all");
  const [, force] = useState(0);

  useEffect(() => {
    const unsub = subscribeActivity(setEntries);
    const tick = setInterval(() => force(x => x + 1), 15000);
    return () => { unsub(); clearInterval(tick); };
  }, []);

  const filtered = useMemo(() => {
    let f = entries;
    if (filter === "mcq") f = entries.filter(e => e.type.startsWith("mcq_"));
    else if (filter === "user") f = entries.filter(e => e.type.startsWith("user_"));
    else if (filter === "system") f = entries.filter(e => e.type === "premium_code_update" || e.type === "admin_credentials_update");
    return limit ? f.slice(0, limit) : f;
  }, [entries, filter, limit]);

  const handleClear = () => {
    if (confirm("Clear all activity history?")) clearActivity();
  };

  return (
    <div className="border border-border rounded-2xl p-4 bg-card">
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
            <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
              LIVE
            </span>
          </div>
          {showClear && entries.length > 0 && (
            <button onClick={handleClear} className="text-[11px] font-semibold text-destructive">
              Clear
            </button>
          )}
        </div>
      )}

      {!limit && entries.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-3">
          {[
            { k: "all", l: "All" },
            { k: "mcq", l: "MCQs" },
            { k: "user", l: "Users" },
            { k: "system", l: "System" },
          ].map(t => (
            <button key={t.k} onClick={() => setFilter(t.k as typeof filter)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors duration-100 ${
                filter === t.k ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}>
              {t.l}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-6">
          <Activity size={28} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {filtered.map(e => {
              const Icon = iconMap[e.type] || Activity;
              return (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-muted/40"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorMap[e.type]}`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-[11px] font-bold text-foreground">{actionLabels[e.type]}</p>
                      <p className="text-[10px] text-muted-foreground shrink-0">{timeAgo(e.timestamp)}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug truncate">{e.summary}</p>
                    <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                      by {e.actor} · {new Date(e.timestamp).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
