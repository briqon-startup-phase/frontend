import { EquipmentScreen } from "@/components/dashboard-screens";
export const metadata = { title: "Equipment" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ condition?: string }>;
}) {
  const { condition } = await searchParams;
  return (
    <EquipmentScreen
      initialCondition={condition === "attention" ? "attention" : "all"}
    />
  );
}
