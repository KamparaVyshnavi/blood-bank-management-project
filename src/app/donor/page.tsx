import { DonorApp } from "@/components/portals/donor-app";

export const metadata = { title: "Donor Management" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <DonorApp />;
}
