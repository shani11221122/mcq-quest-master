import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, BarChart3, Clock, Settings } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: BookOpen, label: "Quiz", path: "/quiz" },
  { icon: BarChart3, label: "Stats", path: "/dashboard" },
  { icon: Clock, label: "History", path: "/history" },
  { icon: Settings, label: "More", path: "/settings" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || 
            (tab.path === "/quiz" && location.pathname.startsWith("/quiz"));
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px]"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                size={20}
                className={`transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
