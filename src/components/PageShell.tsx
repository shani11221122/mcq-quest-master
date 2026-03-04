import { ReactNode } from "react";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "./BottomNav";

interface PageShellProps {
  children: ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

/**
 * PageShell provides the scaffold layout:
 * - Full viewport height (h-dvh)
 * - Scrollable content area
 * - Fixed BottomNav pinned at bottom (optional)
 * - Safe area insets handled
 */
const PageShell = ({ children, showBottomNav = true, className = "" }: PageShellProps) => {
  return (
    <div className="h-dvh flex flex-col bg-background">
      <div
        className={`flex-1 overflow-y-auto overscroll-contain ${className}`}
        style={showBottomNav ? { paddingBottom: `calc(${BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px))` } : undefined}
      >
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
};

export default PageShell;
