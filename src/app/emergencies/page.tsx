import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getEmergencies } from "@/lib/ops-data";
import { EmergenciesView } from "@/components/views/emergencies-view";

export const metadata = { title: "Emergencies" };
export const dynamic = "force-dynamic";

export default async function EmergenciesPage() {
  const d = await getEmergencies();
  if (!d) notFound();
  return <Suspense><EmergenciesView items={d.items} cards={d.cards} canCreate={d.canCreate} now={d.now} /></Suspense>;
}
