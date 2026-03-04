import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import puzzleLogo from "@/assets/puzzle-logo.png";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signup(username, email, password)) {
      toast.success("Account created!");
      navigate("/home");
    } else {
      toast.error("Username already taken");
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
          alt="MDCAT Prep"
          className="w-28 h-28 object-contain"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        />
      </div>

      <motion.div
        className="flex-1 -mt-6 bg-background rounded-t-[2rem] px-6 pt-10 pb-8"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-2xl font-extrabold text-center mb-8">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="input-field w-full"
            required
          />
          <input
            type="email"
            placeholder="Gmail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-field w-full"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field w-full"
            required
          />
          <button type="submit" className="btn-primary w-full mt-4">
            Create
          </button>
        </form>

        <p className="text-center text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-bold">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
