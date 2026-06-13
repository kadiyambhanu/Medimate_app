"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  Calendar,
  Clock,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";

const navSections = [
  {
    label: "Overview",
    items: [{ href: "/hospital", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Hospital",
    items: [
      { href: "/hospital/profile", label: "Profile", icon: Building2 },
      { href: "/hospital/doctors", label: "Doctors", icon: Stethoscope },
      { href: "/hospital/schedules", label: "Schedules", icon: Clock },
    ],
  },
  {
    label: "Patients",
    items: [{ href: "/hospital/appointments", label: "Appointments", icon: Calendar }],
  },
  {
    label: "System",
    items: [{ href: "/hospital/settings", label: "Settings", icon: Settings }],
  },
];

interface HospitalSidebarProps {
  open: boolean;
  onClose: () => void;
}

function isActive(pathname: string, href: string) {
  if (href === "/hospital") return pathname === "/hospital";
  return pathname.startsWith(href);
}

export function HospitalSidebar({ open, onClose }: HospitalSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link href="/hospital" className="flex min-w-0 items-center gap-3" onClick={onClose}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-bold text-primary">
                {user?.hospitalName || "Hospital"}
              </span>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Hospital Portal
              </p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-5">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="truncate text-xs font-medium">{user?.hospitalName || "Your Hospital"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
