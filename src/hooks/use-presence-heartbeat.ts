import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { recordHeartbeat, clearPresence, HEARTBEAT_MS } from "@/lib/presence";

const ROUTE_LABELS: Record<string, string> = {
  "/home": "Home",
  "/quiz": "Choosing quiz",
  "/mock-test": "Mock test",
  "/dashboard": "Dashboard",
  "/history": "History",
  "/settings": "Settings",
  "/admin": "Admin panel",
};

function labelFor(path: string) {
  if (path.startsWith("/quiz/")) return "In quiz";
  if (path.startsWith("/result")) return "Reviewing result";
  return ROUTE_LABELS[path] || "Browsing";
}

/** Mounted once at app shell — sends a heartbeat for the logged-in user. */
export function usePresenceHeartbeat() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user?.username) return;
    const tick = () => recordHeartbeat(user.username, location.pathname, labelFor(location.pathname));
    tick();
    const id = window.setInterval(tick, HEARTBEAT_MS);
    const onUnload = () => clearPresence(user.username);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [user?.username, location.pathname]);
}
