/**
 * Local presence tracker (frontend-only).
 * Tracks online users + last activity via localStorage heartbeats.
 * Real-time backend monitoring would require Lovable Cloud + WebSockets.
 *
 * Storage key: mdcat_presence -> { [username]: PresenceRecord }
 * Never stores passwords or sensitive credentials.
 */

const KEY = "mdcat_presence";
const HEARTBEAT_MS = 5_000;
export const ONLINE_WINDOW_MS = 30_000; // active within last 30s = online

export interface PresenceRecord {
  username: string;
  lastSeen: number;       // epoch ms
  route: string;          // current route path
  activity: string;       // human-readable activity label
  sessionStart: number;   // epoch ms
}

type PresenceMap = Record<string, PresenceRecord>;

function read(): PresenceMap {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function write(map: PresenceMap) {
  localStorage.setItem(KEY, JSON.stringify(map));
  try { window.dispatchEvent(new CustomEvent("mdcat-presence")); } catch {}
}

export function recordHeartbeat(username: string, route: string, activity = "Browsing") {
  if (!username) return;
  const map = read();
  const prev = map[username];
  map[username] = {
    username,
    lastSeen: Date.now(),
    route,
    activity,
    sessionStart: prev?.sessionStart ?? Date.now(),
  };
  // prune very old entries (>1 day)
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  Object.keys(map).forEach(k => { if (map[k].lastSeen < cutoff) delete map[k]; });
  write(map);
}

export function clearPresence(username: string) {
  const map = read();
  if (map[username]) { delete map[username]; write(map); }
}

export function getPresence(): PresenceRecord[] {
  return Object.values(read()).sort((a, b) => b.lastSeen - a.lastSeen);
}

export function isOnline(rec: PresenceRecord) {
  return Date.now() - rec.lastSeen < ONLINE_WINDOW_MS;
}

export { HEARTBEAT_MS };
