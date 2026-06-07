import { Suspense } from "react";
import { SuperAdminAuthForm } from "@/features/auth/super-admin-auth-form";
import { PageLoader } from "@/components/shared/loading-spinner";

export const metadata = { title: "Super Admin Login" };

export default function SuperAdminLoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SuperAdminAuthForm mode="login" />
    </Suspense>
  );
}
