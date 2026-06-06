import { Suspense } from "react";
import { RemindersContent } from "@/features/reminders/reminders-content";
import { PageLoader } from "@/components/shared/loading-spinner";

export const metadata = { title: "Reminders" };

export default function RemindersPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RemindersContent />
    </Suspense>
  );
}
