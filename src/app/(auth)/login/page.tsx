import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
import { PageLoader } from "@/components/shared/loading-spinner";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
