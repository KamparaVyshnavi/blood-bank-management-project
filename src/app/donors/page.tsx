import { getDonors } from "@/lib/ops-data";
import { DonorsView } from "@/components/views/donors-view";

export const metadata = { title: "Donors" };
export const dynamic = "force-dynamic";

export default async function Page() { const d = await getDonors(); return <DonorsView items={d.items} cards={d.cards} now={d.now} />; }
