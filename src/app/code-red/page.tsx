import { CodeRedModes } from "@/components/portals/durable-code-red";
import { clerkConfigured } from "@/server/identity";
export const metadata = { title: "Emergency Coordination" };
export default function Page() { return <CodeRedModes configured={clerkConfigured()} />; }
