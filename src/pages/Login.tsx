import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import puzzleLogo from "@/assets/logo.jpeg";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && user) navigate(user.isAdmin ? "/admin" : "/home", { replace: true });
  }, [ready, user, navigate]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      toast.success("Welcome back!");
      navigate("/home");
    } else {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="auth-header relative flex flex-col items-center justify-center pt-12 pb-16 px-6 rounded-b-[2rem]">
        <button onClick={() => navigate("/")} className="absolute top-6 left-6 text-primary-foreground">
          <ArrowLeft size={24} />
        </button>
        <motion.img
          src={puzzleLogo}
          alt="MDCAT Smart Prep"
          className="h-28 w-auto max-w-[80%] object-contain"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, duration: 0.2 }}
        />
      </div>

      <motion.div
        className="flex-1 -mt-6 bg-background rounded-t-[2rem] px-6 pt-10 pb-8 flex flex-col"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.05 }}
      >
        <h1 className="text-2xl font-extrabold text-center mb-1">Welcome Back!</h1>
        <p className="text-muted-foreground text-center mb-8">Log in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
          <input type="text" placeholder="Enter Username" value={username} onChange={e => setUsername(e.target.value)} className="input-field w-full" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input-field w-full" required />
          <button type="submit" className="btn-primary w-full mt-4">Log in</button>
          <div className="flex-1" />
          <p className="text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-bold">Sign up</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
