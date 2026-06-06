import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
import { PageLoader } from "@/components/shared/loading-spinner";

export const metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
