import { DoctorDetailContent } from "@/features/hospitals/doctor-detail-content";

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string; doctorId: string }>;
}) {
  const { id, doctorId } = await params;
  return <DoctorDetailContent hospitalId={id} doctorId={doctorId} />;
}
