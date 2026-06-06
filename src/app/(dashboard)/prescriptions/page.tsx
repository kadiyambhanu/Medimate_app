import { Suspense } from "react";
import { PrescriptionsContent } from "@/features/prescriptions/prescriptions-content";
import { PageLoader } from "@/components/shared/loading-spinner";

export const metadata = { title: "Prescriptions" };

export default function PrescriptionsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PrescriptionsContent />
    </Suspense>
  );
}
