import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import puzzleLogo from "@/assets/puzzle-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <motion.img
        src={puzzleLogo}
        alt="MDCAT Prep"
        className="w-32 h-32 mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      />
      <motion.h1
        className="text-3xl font-extrabold text-foreground mb-2 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        MDCAT Prep
      </motion.h1>
      <motion.p
        className="text-muted-foreground text-center mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Your ultimate preparation companion
      </motion.p>

      <motion.div
        className="w-full max-w-sm space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button onClick={() => navigate("/login")} className="btn-primary w-full">
          Log in
        </button>
        <button
          onClick={() => navigate("/signup")}
          className="w-full h-14 rounded-xl text-lg font-bold border-2 border-primary text-primary hover:bg-primary/5 transition-colors"
        >
          Sign up
        </button>
      </motion.div>
    </div>
  );
};

export default Index;
