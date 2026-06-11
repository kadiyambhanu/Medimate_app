"use client";

import { useState } from "react";
import { HospitalSidebar } from "./hospital-sidebar";
import { Navbar } from "./navbar";

export function HospitalLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <HospitalSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/40 to-muted/20 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
