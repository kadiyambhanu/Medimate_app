import { AuthForm } from "@/features/auth/auth-form";

export const metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" />;
}
