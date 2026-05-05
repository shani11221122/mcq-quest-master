import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import adminLogo from "@/assets/logo.jpeg";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in as admin, redirect
  if (user?.isAdmin) {
    navigate("/admin", { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (locked) {
      toast.error("Too many attempts. Please wait 30 seconds.");
      return;
    }

    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const success = login(username, password);

    if (success) {
      // Check if the logged-in user is actually an admin
      const savedUser = JSON.parse(localStorage.getItem("mdcat_user") || "{}");
      if (savedUser.isAdmin) {
        toast.success("Welcome, Admin!");
        navigate("/admin", { replace: true });
      } else {
        toast.error("Access denied. Admin credentials required.");
        // Log them out since they're not admin
        localStorage.removeItem("mdcat_user");
        window.location.reload();
      }
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLocked(true);
        toast.error("Account locked for 30 seconds due to too many failed attempts.");
        setTimeout(() => {
          setLocked(false);
          setAttempts(0);
        }, 30000);
      } else {
        toast.error(`Invalid credentials (${5 - newAttempts} attempts remaining)`);
      }
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-foreground)/0.08),transparent_50%)]" />

        <div className="relative px-5 pt-12 pb-10 flex flex-col items-center">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-5 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft size={22} />
          </button>

          <motion.div
            className="h-20 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center px-3 py-2 mb-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <img src={adminLogo} alt="MDCAT Smart Prep" className="h-full w-auto max-w-[160px] object-contain" />
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <h1 className="text-2xl font-extrabold text-primary-foreground">Admin Access</h1>
            <p className="text-primary-foreground/60 text-sm mt-1">Restricted area — authorized personnel only</p>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <motion.div
        className="flex-1 -mt-4 bg-background rounded-t-[2rem] px-6 pt-8 pb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.05 }}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Admin Username
            </label>
            <input
              type="text"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field w-full"
              disabled={locked}
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full pr-12"
                disabled={locked}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {locked && (
            <div className="bg-destructive/10 text-destructive text-xs font-medium px-4 py-3 rounded-xl">
              🔒 Too many failed attempts. Please wait 30 seconds before trying again.
            </div>
          )}

          <button
            type="submit"
            disabled={locked}
            className="btn-primary w-full mt-6 disabled:opacity-40"
          >
            {locked ? "Account Locked" : "Sign In as Admin"}
          </button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            This panel is for administrators only.
            <br />
            Regular users should use the{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-primary font-semibold"
            >
              standard login
            </button>
            .
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
