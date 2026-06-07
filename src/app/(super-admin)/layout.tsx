"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminLayout } from "@/components/layout/super-admin-layout";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/hooks/use-auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { fetchUser, isLoading, user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/superadmin");
    } else if (!isLoading && user && user.role !== "SUPER_ADMIN") {
      router.replace(user.role === "HOSPITAL" ? "/hospital" : "/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated || user?.role !== "SUPER_ADMIN") return <PageLoader />;

  return <SuperAdminLayout>{children}</SuperAdminLayout>;
}
