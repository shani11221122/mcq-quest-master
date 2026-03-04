import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, BarChart3, Clock, Settings } from "lucide-react";

const tabs = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: BookOpen, label: "Quiz", path: "/quiz" },
  { icon: BarChart3, label: "Stats", path: "/dashboard" },
  { icon: Clock, label: "History", path: "/history" },
  { icon: Settings, label: "More", path: "/settings" },
];

const BOTTOM_NAV_HEIGHT = "4rem";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50"
      style={{ height: `calc(${BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px))`, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
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
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <Icon
                size={20}
                className={isActive ? "text-primary" : "text-muted-foreground"}
              />
              <span
                className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}
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

export { BOTTOM_NAV_HEIGHT };
export default BottomNav;
