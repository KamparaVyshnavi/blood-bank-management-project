/** Role values mirror the server-validated Clerk registry membership. */
export type Role = "STATE_ADMIN" | "BANK" | "HOSPITAL" | "DONOR";

/** Parse only the role label for navigation; this is never an authorization check. */
export function navigationRole(metadata: unknown): Role | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const registry = (metadata as { registry?: unknown }).registry;
  if (!registry || typeof registry !== "object" || Array.isArray(registry)) return null;
  const role = (registry as { role?: unknown }).role;
  return role === "STATE_ADMIN" || role === "BANK" || role === "HOSPITAL" || role === "DONOR" ? role : null;
}
