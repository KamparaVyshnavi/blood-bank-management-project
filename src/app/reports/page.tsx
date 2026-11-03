import { getReports } from "@/lib/ops-data";
import { ReportsView } from "@/components/views/reports-view";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function Page() { const d = await getReports(); return <ReportsView data={d} />; }
