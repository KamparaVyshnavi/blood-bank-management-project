import { Suspense } from "react";
import { getEmergencies } from "@/lib/ops-data";
import { EmergenciesView } from "@/components/views/emergencies-view";

export const metadata = { title: "Emergencies" };
export const dynamic = "force-dynamic";

export default async function EmergenciesPage() {
  const d = await getEmergencies();
  return <Suspense><EmergenciesView items={d.items} cards={d.cards} hospitals={d.hospitals} now={d.now} /></Suspense>;
}
