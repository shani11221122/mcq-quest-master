import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { BookOpen, ClipboardCheck, ScrollText, Clock, KeyRound, LogOut, Hourglass } from "lucide-react";

const menuItems = [
  { label: "Start Quiz", icon: BookOpen, route: "/quiz", span: "full", color: "text-primary" },
  { label: "Mockup Test", icon: ClipboardCheck, route: "/quiz", span: "full", color: "text-primary" },
  { label: "Rules", icon: ScrollText, route: "/rules", span: "half", color: "text-primary" },
  { label: "History", icon: Clock, route: "/history", span: "half", color: "text-primary" },
  { label: "Edit Password", icon: KeyRound, route: "#", span: "half", color: "text-primary" },
  { label: "Logout", icon: LogOut, route: "logout", span: "half", color: "text-primary" },
  { label: "Up Coming", icon: Hourglass, route: "#", span: "half", color: "text-primary" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleClick = (route: string) => {
    if (route === "logout") {
      logout();
      navigate("/login");
    } else if (route !== "#") {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="auth-header px-6 pt-10 pb-12 rounded-b-[2rem]">
        <h1 className="text-2xl font-extrabold text-primary-foreground">Home</h1>
        <p className="text-primary-foreground/80 text-lg mt-2">Hello, {user?.username || "Student"}</p>
        {user?.isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="mt-3 bg-primary-foreground/20 text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-bold"
          >
            Admin Panel
          </button>
        )}
      </div>

      <div className="px-6 pt-8 pb-6">
        <h2 className="text-xl font-extrabold mb-5">Menu</h2>

        <motion.div
          className="grid grid-cols-2 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {menuItems.map((m) => {
            const Icon = m.icon;
            const isFull = m.span === "full";
            return (
              <motion.button
                key={m.label}
                variants={item}
                className={`menu-card ${isFull ? "col-span-2" : "menu-card-small"} active:scale-[0.97]`}
                onClick={() => handleClick(m.route)}
                whileTap={{ scale: 0.97 }}
              >
                <div className={`${isFull ? "w-14 h-14" : "w-12 h-12"} rounded-full bg-primary/10 flex items-center justify-center`}>
                  <Icon className={`${m.color} ${isFull ? "w-7 h-7" : "w-6 h-6"}`} />
                </div>
                <span className="font-bold text-base">{m.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
