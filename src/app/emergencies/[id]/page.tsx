import { notFound } from "next/navigation";
import { getEmergency } from "@/lib/ops-data";
import { EmergencyDetail } from "@/components/views/emergency-detail";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { return { title: `Emergency ${(await params).id}` }; }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const data = await getEmergency((await params).id);
  if (!data) notFound();
  return <EmergencyDetail emergency={data.emergency} now={data.now} />;
}
