import { RegistryPortal } from "@/components/portals/registry-portal";
import { clerkConfigured } from "@/server/identity";

export const metadata = { title: "Hospitals" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <RegistryPortal role="HOSPITAL" configured={clerkConfigured()} />;
}
