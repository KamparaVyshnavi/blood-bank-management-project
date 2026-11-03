import { AuditMeter } from "@/components/portals/audit-meter";
import { RegistryPortal } from "@/components/portals/registry-portal";
import { clerkConfigured } from "@/server/identity";

export const metadata = { title: "Reports & Analytics" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <RegistryPortal role="STATE_ADMIN" configured={clerkConfigured()} />
      <AuditMeter />
    </>
  );
}
