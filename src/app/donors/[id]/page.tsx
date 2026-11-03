import { notFound } from "next/navigation";
import { getDonor } from "@/lib/ops-data";
import { DonorDetail } from "@/components/views/donor-detail";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { return { title: `Donor ${(await params).id}` }; }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const d = await getDonor((await params).id);
  if (!d) notFound();
  return <DonorDetail donor={d.donor} now={d.now} />;
}
