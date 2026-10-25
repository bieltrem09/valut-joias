"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";

type SidebarCtx = { collapsed: boolean; toggle: () => void };
const Ctx = React.createContext<SidebarCtx>({ collapsed: false, toggle: () => {} });
export const useSidebar = () => React.useContext(Ctx);

export function Providers({ children, initialCollapsed }: { children: React.ReactNode; initialCollapsed: boolean }) {
  const [collapsed, setCollapsed] = React.useState(initialCollapsed);
  const toggle = React.useCallback(() => {
    setCollapsed((c) => {
      document.cookie = `sidebar=${c ? "expanded" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
      return !c;
    });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {/* reducedMotion="user": o Motion respeita prefers-reduced-motion em transform/layout. */}
      <MotionConfig reducedMotion="user">
        <Ctx.Provider value={{ collapsed, toggle }}>{children}</Ctx.Provider>
        <Toaster
          position="bottom-center"
          duration={3000}
          offset={24}
          mobileOffset={{ bottom: 88 }}
          toastOptions={{
            classNames: {
              toast: "!rounded-control !bg-popover !text-popover-foreground !ring-1 !ring-border !shadow-pop !border-0 !font-sans !text-13 !gap-2.5",
              description: "!text-muted-foreground",
              success: "[&_[data-icon]]:!text-profit",
              error: "[&_[data-icon]]:!text-destructive",
            },
          }}
        />
      </MotionConfig>
    </ThemeProvider>
  );
}
