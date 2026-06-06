"use client";

import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}
