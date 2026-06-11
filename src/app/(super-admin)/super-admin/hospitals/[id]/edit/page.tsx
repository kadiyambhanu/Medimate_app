import { HospitalFormContent } from "@/features/super-admin/hospital-form-content";

export default async function EditHospitalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HospitalFormContent mode="edit" hospitalId={id} />;
}
