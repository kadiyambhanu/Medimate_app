"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HospitalLayout } from "@/components/layout/hospital-layout";
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
      router.replace("/hospital/login");
    } else if (!isLoading && user && user.role !== "HOSPITAL") {
      router.replace(user.role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated || user?.role !== "HOSPITAL") return <PageLoader />;

  return <HospitalLayout>{children}</HospitalLayout>;
}
