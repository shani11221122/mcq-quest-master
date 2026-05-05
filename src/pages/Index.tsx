import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import puzzleLogo from "@/assets/logo.jpeg";
import { useAuth } from "@/lib/auth-context";

const Index = () => {
  const navigate = useNavigate();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && user) {
      navigate(user.isAdmin ? "/admin" : "/home", { replace: true });
    }
  }, [ready, user, navigate]);

  if (!ready || user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <motion.img
        src={puzzleLogo}
        alt="MDCAT Smart Prep"
        className="h-36 w-auto max-w-[85%] object-contain mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, duration: 0.2 }}
      />
      <motion.p
        className="text-muted-foreground text-center mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.1 }}
      >
        Your ultimate preparation companion
      </motion.p>

      <motion.div
        className="w-full max-w-sm space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, delay: 0.12 }}
      >
        <button onClick={() => navigate("/login")} className="btn-primary w-full">
          Log in
        </button>
        <button
          onClick={() => navigate("/signup")}
          className="w-full h-14 rounded-xl text-lg font-bold border-2 border-primary text-primary hover:bg-primary/5 transition-colors duration-100"
        >
          Sign up
        </button>
      </motion.div>
    </div>
  );
};

export default Index;
