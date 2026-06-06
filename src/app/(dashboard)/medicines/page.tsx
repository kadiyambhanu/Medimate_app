import { Suspense } from "react";
import { MedicinesContent } from "@/features/medicines/medicines-content";
import { PageLoader } from "@/components/shared/loading-spinner";

export const metadata = { title: "Medicines" };

export default function MedicinesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MedicinesContent />
    </Suspense>
  );
}
