import { getEmergency, getNow } from "@/lib/ops-data";
import { EmergencyDetail } from "@/components/views/emergency-detail";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Emergency ${id}` };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getEmergency(id);
  const now = data?.now ?? (await getNow());
  return <EmergencyDetail id={id} emergency={data?.emergency} now={now} />;
}
