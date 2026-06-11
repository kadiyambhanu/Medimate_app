import { SuperAdminHospitalDetailContent } from "@/features/super-admin/hospital-detail-content";

export default async function SuperAdminHospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SuperAdminHospitalDetailContent hospitalId={id} />;
}
