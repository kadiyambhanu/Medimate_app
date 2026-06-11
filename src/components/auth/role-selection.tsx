"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Building2,
  Shield,
  ChevronRight,
  Pill,
  Bell,
  Stethoscope,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/features/auth/auth-form";
import { PageLoader } from "@/components/shared/loading-spinner";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const roles = [
  {
    id: "patient",
    title: "Patient",
    description: "Track medicines, set reminders, and manage your health journey.",
    icon: Heart,
    accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "hover:border-blue-500/40 hover:bg-blue-500/5",
    href: null,
  },
  {
    id: "hospital",
    title: "Hospital",
    description: "Manage doctors, schedules, appointments, and prescriptions.",
    icon: Building2,
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    border: "hover:border-emerald-500/40 hover:bg-emerald-500/5",
    href: "/hospital/login",
  },
  {
    id: "super-admin",
    title: "Super Admin",
    description: "Oversee hospitals, analytics, and platform-wide operations.",
    icon: Shield,
    accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    border: "hover:border-violet-500/40 hover:bg-violet-500/5",
    href: "/superadmin",
  },
] as const;

function RoleCard({
  role,
  onSelect,
  href,
  selected,
}: {
  role: (typeof roles)[number];
  onSelect?: () => void;
  href?: string;
  selected?: boolean;
}) {
  const Icon = role.icon;

  const inner = (
    <div
      className={cn(
        "group flex w-full cursor-pointer items-center gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-all",
        selected ? "border-primary ring-1 ring-primary/30" : "border-border",
        role.border
      )}
    >
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", role.accent)}>
        <Icon className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-foreground">{role.title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{role.description}</p>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </div>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className="w-full text-left">
        {inner}
      </button>
    );
  }

  return (
    <Link href={href!} className="block w-full">
      {inner}
    </Link>
  );
}

function PatientLoginPanel({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to portals
      </Button>

      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Patient Login</h2>
        <p className="text-sm text-muted-foreground">Sign in to manage your medicines and health</p>
      </div>

      <Suspense fallback={<PageLoader />}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}

export function RoleSelection() {
  const [showPatientLogin, setShowPatientLogin] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <Heart className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">{APP_NAME}</span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Smart healthcare for everyone
          </h1>
          <p className="max-w-md text-lg text-primary-foreground/80">
            Choose your portal to access personalized tools for patients, hospitals, and platform administrators.
          </p>
          <div className="flex gap-6 pt-2">
            {[Pill, Bell, Stethoscope].map((Icon, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15"
              >
                <Icon className="h-5 w-5" />
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>

      <div className="flex min-h-screen w-full flex-col bg-background lg:w-1/2">
        <div className="flex items-center gap-2 p-6 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">{APP_NAME}</span>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 pb-10 pt-4 lg:px-12">
          {showPatientLogin ? (
            <PatientLoginPanel onBack={() => setShowPatientLogin(false)} />
          ) : (
            <div className="mx-auto w-full max-w-lg">
              <div className="mb-8 space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Choose your portal</h2>
                <p className="text-sm text-muted-foreground">
                  Select how you want to sign in to {APP_NAME}
                </p>
              </div>

              <div className="space-y-3">
                {roles.map((role) =>
                  role.id === "patient" ? (
                    <RoleCard
                      key={role.id}
                      role={role}
                      selected={false}
                      onSelect={() => setShowPatientLogin(true)}
                    />
                  ) : (
                    <RoleCard key={role.id} role={role} href={role.href!} />
                  )
                )}
              </div>

              <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">
                &copy; {new Date().getFullYear()} {APP_NAME}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
