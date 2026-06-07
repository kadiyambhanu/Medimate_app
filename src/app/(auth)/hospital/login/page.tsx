import { Suspense } from "react";
import { HospitalAuthForm } from "@/features/auth/hospital-auth-form";
import { PageLoader } from "@/components/shared/loading-spinner";

export const metadata = { title: "Hospital Login" };

export default function HospitalLoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <HospitalAuthForm />
    </Suspense>
  );
}
