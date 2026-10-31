import { OverviewScreen } from "@/components/dashboard-screens";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const { room } = await searchParams;
  return <OverviewScreen selectedRoom={room || "all"} />;
}
