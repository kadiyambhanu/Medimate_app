import { DoctorFormContent } from "@/features/hospital/doctor-form-content";

export default async function EditDoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DoctorFormContent mode="edit" doctorId={id} />;
}
