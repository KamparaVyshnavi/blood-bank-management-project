import { getDonor, getNow } from "@/lib/ops-data";
import { DonorDetail } from "@/components/views/donor-detail";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Donor ${id}` };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDonor(id);
  const now = d?.now ?? (await getNow());
  return <DonorDetail id={id} donor={d?.donor} now={now} />;
}
