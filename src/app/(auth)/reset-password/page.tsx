import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
import { PageLoader } from "@/components/shared/loading-spinner";

export const metadata = { title: "Reset Password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <Suspense fallback={<PageLoader />}>
      <AuthForm mode="reset" resetToken={token} />
    </Suspense>
  );
}
