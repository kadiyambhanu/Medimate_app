"use client";

import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/hooks/use-auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { fetchUser, isLoading } = useAuth();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) return <PageLoader />;

  return <DashboardLayout>{children}</DashboardLayout>;
}
