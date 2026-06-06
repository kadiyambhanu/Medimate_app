import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
import { PageLoader } from "@/components/shared/loading-spinner";

export const metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AuthForm mode="forgot" />
    </Suspense>
  );
}
