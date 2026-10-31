import { EquipmentDetail } from "@/components/equipment-detail";
export const metadata = { title: "Equipment details" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EquipmentDetail id={id} />;
}
