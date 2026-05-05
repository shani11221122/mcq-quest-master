import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  username: string;
  email: string;
  isAdmin: boolean;
  isPremium: boolean;
}

const SESSION_KEY = "mdcat_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface StoredSession { user: User; expiresAt: number; }

function persistSession(user: User) {
  const session: StoredSession = { user, expiresAt: Date.now() + SESSION_DURATION_MS };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem("mdcat_user", JSON.stringify(user)); // backward compat
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const s: StoredSession = JSON.parse(raw);
      if (s.expiresAt && s.expiresAt > Date.now()) {
        // sliding renewal: extend on each load
        persistSession(s.user);
        return s.user;
      }
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem("mdcat_user");
      return null;
    }
    // legacy fallback
    const legacy = localStorage.getItem("mdcat_user");
    if (legacy) {
      const u = JSON.parse(legacy);
      persistSession(u);
      return u;
    }
  } catch {}
  return null;
}

interface AuthContextType {
  user: User | null;
  ready: boolean;
  login: (username: string, password: string) => boolean;
  signup: (username: string, email: string, password: string) => boolean;
  logout: () => void;
  unlockPremium: (code: string) => boolean;
  changeAdminCredentials: (currentPassword: string, newUsername: string, newPassword: string) => boolean;
  changePassword: (currentPassword: string, newPassword: string) => { ok: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | null>(null);

const PREMIUM_CODE_KEY = "mdcat_premium_code";
const DEFAULT_PREMIUM_CODE = "MDCAT2024";
const ADMIN_CREDS_KEY = "mdcat_admin_creds";

interface AdminCreds { username: string; password: string; }

function getAdminCreds(): AdminCreds {
  const saved = localStorage.getItem(ADMIN_CREDS_KEY);
  if (saved) return JSON.parse(saved);
  return { username: "admin", password: "admin123" };
}

function getValidCode(): string {
  return localStorage.getItem(PREMIUM_CODE_KEY) || DEFAULT_PREMIUM_CODE;
}

export function setPremiumCode(code: string) {
  localStorage.setItem(PREMIUM_CODE_KEY, code);
}

export function getPremiumCode(): string {
  return getValidCode();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restored = loadSession();
    if (restored) setUser(restored);
    setReady(true);
  }, []);

  const login = (username: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem("mdcat_users") || "[]");
    const found = users.find((u: any) => u.username === username && u.password === password);
    if (found) {
      const userData: User = { username: found.username, email: found.email, isAdmin: found.isAdmin || false, isPremium: found.isPremium || false };
      setUser(userData);
      persistSession(userData);
      return true;
    }
    const adminCreds = getAdminCreds();
    if (username === adminCreds.username && password === adminCreds.password) {
      const userData: User = { username: adminCreds.username, email: "admin@mdcat.com", isAdmin: true, isPremium: true };
      setUser(userData);
      persistSession(userData);
      return true;
    }
    return false;
  };

  const signup = (username: string, email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem("mdcat_users") || "[]");
    if (users.find((u: any) => u.username === username)) return false;
    users.push({ username, email, password, isAdmin: false, isPremium: false });
    localStorage.setItem("mdcat_users", JSON.stringify(users));
    const userData: User = { username, email, isAdmin: false, isPremium: false };
    setUser(userData);
    persistSession(userData);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("mdcat_user");
  };

  const unlockPremium = (code: string): boolean => {
    if (code.trim().toUpperCase() === getValidCode().toUpperCase()) {
      if (user) {
        const updated = { ...user, isPremium: true };
        setUser(updated);
        persistSession(updated);
        // Also update in users list
        const users = JSON.parse(localStorage.getItem("mdcat_users") || "[]");
        const idx = users.findIndex((u: any) => u.username === user.username);
        if (idx >= 0) { users[idx].isPremium = true; localStorage.setItem("mdcat_users", JSON.stringify(users)); }
      }
      return true;
    }
    return false;
  };

  const changeAdminCredentials = (currentPassword: string, newUsername: string, newPassword: string): boolean => {
    const creds = getAdminCreds();
    if (currentPassword !== creds.password) return false;
    const updated: AdminCreds = {
      username: newUsername.trim() || creds.username,
      password: newPassword.trim() || creds.password,
    };
    localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(updated));
    // Update current session
    if (user?.isAdmin) {
      const updatedUser = { ...user, username: updated.username };
      setUser(updatedUser);
      persistSession(updatedUser);
    }
    return true;
  };

  const changePassword = (currentPassword: string, newPassword: string): { ok: boolean; error?: string } => {
    if (!user) return { ok: false, error: "Not signed in" };
    if (!newPassword || newPassword.length < 8) return { ok: false, error: "New password must be at least 8 characters" };
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) return { ok: false, error: "Use letters and numbers" };
    if (newPassword === currentPassword) return { ok: false, error: "New password must differ from current" };

    if (user.isAdmin) {
      const creds = getAdminCreds();
      if (currentPassword !== creds.password) return { ok: false, error: "Current password is incorrect" };
      localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify({ ...creds, password: newPassword }));
      return { ok: true };
    }

    const users = JSON.parse(localStorage.getItem("mdcat_users") || "[]");
    const idx = users.findIndex((u: any) => u.username === user.username);
    if (idx < 0) return { ok: false, error: "User not found" };
    if (users[idx].password !== currentPassword) return { ok: false, error: "Current password is incorrect" };
    users[idx].password = newPassword;
    localStorage.setItem("mdcat_users", JSON.stringify(users));
    return { ok: true };
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, signup, logout, unlockPremium, changeAdminCredentials, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
