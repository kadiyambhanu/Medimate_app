"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  Calendar,
  Clock,
  FileText,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { href: "/hospital", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hospital/profile", label: "Hospital Profile", icon: Building2 },
  { href: "/hospital/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/hospital/schedules", label: "Doctor Schedules", icon: Clock },
  { href: "/hospital/appointments", label: "Appointments", icon: Calendar },
  { href: "/hospital/prescriptions", label: "Prescriptions", icon: FileText },
  { href: "/hospital/settings", label: "Settings", icon: Settings },
];

interface HospitalSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function HospitalSidebar({ open, onClose }: HospitalSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/hospital" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-sm font-bold text-primary line-clamp-1">
                {user?.hospitalName || "Hospital"}
              </span>
              <p className="text-xs text-muted-foreground">Hospital Portal</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/hospital"
                  ? pathname === "/hospital"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
