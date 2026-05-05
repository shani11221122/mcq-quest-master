// Real-time admin activity log (localStorage-backed, broadcasts via custom event + storage event)

export type AdminActionType =
  | "mcq_add"
  | "mcq_update"
  | "mcq_delete"
  | "mcq_bulk_add"
  | "mcq_import"
  | "mcq_export"
  | "mcq_seed"
  | "user_create"
  | "user_update"
  | "user_delete"
  | "premium_code_update"
  | "admin_credentials_update";

export interface AdminActivityEntry {
  id: string;
  type: AdminActionType;
  summary: string;
  actor: string;
  timestamp: number;
  meta?: Record<string, unknown>;
}

const KEY = "mdcat_admin_activity";
const MAX = 200;
const EVENT = "mdcat:admin-activity";

export function readActivity(): AdminActivityEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function logActivity(
  type: AdminActionType,
  summary: string,
  meta?: Record<string, unknown>,
  actor?: string,
) {
  let resolvedActor = actor;
  if (!resolvedActor) {
    try {
      const u = JSON.parse(localStorage.getItem("mdcat_user") || "null");
      resolvedActor = u?.username || "admin";
    } catch {
      resolvedActor = "admin";
    }
  }
  const entry: AdminActivityEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    summary,
    actor: resolvedActor!,
    timestamp: Date.now(),
    meta,
  };
  const all = readActivity();
  all.unshift(entry);
  const trimmed = all.slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: entry }));
  } catch {
    /* noop */
  }
  return entry;
}

export function clearActivity() {
  localStorage.removeItem(KEY);
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
  } catch {
    /* noop */
  }
}

export function subscribeActivity(cb: (entries: AdminActivityEntry[]) => void) {
  const handler = () => cb(readActivity());
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) handler();
  });
  return () => {
    window.removeEventListener(EVENT, handler);
  };
}

export const actionLabels: Record<AdminActionType, string> = {
  mcq_add: "MCQ Added",
  mcq_update: "MCQ Updated",
  mcq_delete: "MCQ Deleted",
  mcq_bulk_add: "Bulk MCQ Insert",
  mcq_import: "JSON Import",
  mcq_export: "JSON Export",
  mcq_seed: "Seed Defaults",
  user_create: "User Created",
  user_update: "User Updated",
  user_delete: "User Deleted",
  premium_code_update: "Premium Code Updated",
  admin_credentials_update: "Admin Credentials Updated",
};
