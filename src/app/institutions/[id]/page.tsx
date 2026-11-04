import { getInstitution, getNow } from "@/lib/ops-data";
import { InstitutionDetail } from "@/components/views/institution-detail";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getInstitution(id);
  return { title: d?.institution.name ?? "Institution" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getInstitution(id);
  const now = d?.now ?? (await getNow());
  return (
    <InstitutionDetail
      id={id}
      institution={d?.institution}
      now={now}
    />
  );
}
