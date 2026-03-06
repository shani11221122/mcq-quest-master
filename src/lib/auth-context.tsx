import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  username: string;
  email: string;
  isAdmin: boolean;
  isPremium: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  signup: (username: string, email: string, password: string) => boolean;
  logout: () => void;
  unlockPremium: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PREMIUM_CODE_KEY = "mdcat_premium_code";
const DEFAULT_PREMIUM_CODE = "MDCAT2024";

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

  useEffect(() => {
    const saved = localStorage.getItem("mdcat_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = (username: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem("mdcat_users") || "[]");
    const found = users.find((u: any) => u.username === username && u.password === password);
    if (found) {
      const userData: User = { username: found.username, email: found.email, isAdmin: found.isAdmin || false, isPremium: found.isPremium || false };
      setUser(userData);
      localStorage.setItem("mdcat_user", JSON.stringify(userData));
      return true;
    }
    if (username === "admin" && password === "admin123") {
      const userData: User = { username: "Admin", email: "admin@mdcat.com", isAdmin: true, isPremium: true };
      setUser(userData);
      localStorage.setItem("mdcat_user", JSON.stringify(userData));
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
    localStorage.setItem("mdcat_user", JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mdcat_user");
  };

  const unlockPremium = (code: string): boolean => {
    if (code.trim().toUpperCase() === getValidCode().toUpperCase()) {
      if (user) {
        const updated = { ...user, isPremium: true };
        setUser(updated);
        localStorage.setItem("mdcat_user", JSON.stringify(updated));
        // Also update in users list
        const users = JSON.parse(localStorage.getItem("mdcat_users") || "[]");
        const idx = users.findIndex((u: any) => u.username === user.username);
        if (idx >= 0) { users[idx].isPremium = true; localStorage.setItem("mdcat_users", JSON.stringify(users)); }
      }
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, unlockPremium }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
