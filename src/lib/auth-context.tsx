import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  username: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  signup: (username: string, email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
      const userData = { username: found.username, email: found.email, isAdmin: found.isAdmin || false };
      setUser(userData);
      localStorage.setItem("mdcat_user", JSON.stringify(userData));
      return true;
    }
    // Default admin
    if (username === "admin" && password === "admin123") {
      const userData = { username: "Admin", email: "admin@mdcat.com", isAdmin: true };
      setUser(userData);
      localStorage.setItem("mdcat_user", JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const signup = (username: string, email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem("mdcat_users") || "[]");
    if (users.find((u: any) => u.username === username)) return false;
    users.push({ username, email, password, isAdmin: false });
    localStorage.setItem("mdcat_users", JSON.stringify(users));
    const userData = { username, email, isAdmin: false };
    setUser(userData);
    localStorage.setItem("mdcat_user", JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mdcat_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
