import { MedicineEdit } from "@/features/medicines/medicine-edit";

export default async function MedicineEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MedicineEdit id={id} />;
}
