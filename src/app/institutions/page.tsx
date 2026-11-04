import { notFound } from "next/navigation";
import { getInstitutions } from "@/lib/ops-data";
import { InstitutionsView } from "@/components/views/institutions-view";

export const metadata = { title: "Hospitals & blood banks" };
export const dynamic = "force-dynamic";

export default async function Page() { const d = await getInstitutions(); if (!d) notFound(); return <InstitutionsView items={d.items} cards={d.cards} now={d.now} scopeNote={d.scopeNote} />; }
