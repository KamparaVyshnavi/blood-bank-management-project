import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getInventory } from "@/lib/ops-data";
import { InventoryView } from "@/components/views/inventory-view";

export const metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const data = await getInventory();
  if (!data) notFound();
  return <Suspense><InventoryView units={data.units} institutions={data.institutions} now={data.now} /></Suspense>;
}
