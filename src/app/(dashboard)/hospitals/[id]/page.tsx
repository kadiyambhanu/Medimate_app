import { HospitalDetailContent } from "@/features/hospitals/hospital-detail-content";

export default async function HospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HospitalDetailContent hospitalId={id} />;
}
