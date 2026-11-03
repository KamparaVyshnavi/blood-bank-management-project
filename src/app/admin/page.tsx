import { getAdmin } from "@/lib/ops-data";
import { AdminView } from "@/components/views/admin-view";

export const metadata = { title: "Administration" };
export const dynamic = "force-dynamic";

export default async function Page() { const d = await getAdmin(); return <AdminView data={d} />; }
