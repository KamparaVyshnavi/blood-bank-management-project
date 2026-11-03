import { notFound } from "next/navigation";
import { getInstitution } from "@/lib/ops-data";
import { InstitutionDetail } from "@/components/views/institution-detail";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { const d = await getInstitution((await params).id); return { title: d?.institution.name ?? "Institution" }; }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const d = await getInstitution((await params).id);
  if (!d) notFound();
  return <InstitutionDetail {...d} />;
}
