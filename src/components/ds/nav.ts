import type { IconName } from "./icons";
import type { Role } from "@/lib/session";

export type NavItem = { href: string; label: string; icon: IconName; roles: Role[] };
const ALL: Role[] = ["STATE_ADMIN", "BANK", "HOSPITAL"];
export const primaryNav: NavItem[] = [
  { href: "/", label: "Overview", icon: "overview", roles: ALL },
  { href: "/inventory", label: "Inventory", icon: "inventory", roles: ["STATE_ADMIN", "BANK"] },
  { href: "/emergencies", label: "Emergencies", icon: "emergency", roles: ALL },
  { href: "/institutions", label: "Hospitals & banks", icon: "institutions", roles: ["STATE_ADMIN", "BANK", "HOSPITAL"] },
  { href: "/donors", label: "Donors", icon: "donors", roles: ["STATE_ADMIN", "BANK"] },
  { href: "/reports", label: "Reports", icon: "reports", roles: ALL },
];
export const adminNav: NavItem[] = [{ href: "/admin", label: "Administration", icon: "admin", roles: ["STATE_ADMIN"] }];
export const labsNav: NavItem = { href: "/labs", label: "Labs", icon: "labs", roles: ["STATE_ADMIN"] };
export const visible = (items: NavItem[], role: Role | null = null) => role ? items.filter(i => i.roles.includes(role)) : items.filter(i => ["STATE_ADMIN", "BANK", "HOSPITAL"].every(required => i.roles.includes(required as Role)));
