import type { AppUser } from "../lib/ops-types";

const ROLE_LABELS: Record<string, AppUser["role"]> = {
  STATE_ADMIN: "State admin",
  BANK: "Blood bank",
  HOSPITAL: "Hospital",
  DONOR: "Donor",
};

type ClerkUserShape = {
  id?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  username?: unknown;
  emailAddresses?: unknown;
  primaryEmailAddressId?: unknown;
  publicMetadata?: unknown;
  banned?: unknown;
  locked?: unknown;
  lastSignInAt?: unknown;
};


/** The directory is partition-scoped; Clerk accounts for another state are never projected. */
export function clerkUserBelongsToState(input: unknown, stateId: string): boolean {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const metadata = (input as ClerkUserShape).publicMetadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
  const registry = (metadata as Record<string, unknown>).registry;
  return Boolean(registry && typeof registry === "object" && !Array.isArray(registry) && (registry as Record<string, unknown>).stateId === stateId);
}

/** Allowlisted projection of Clerk data; never returns raw metadata or PII beyond email. */
export function clerkUserToAppUser(input: unknown): AppUser | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const user = input as ClerkUserShape;
  if (typeof user.id !== "string" || !/^user_[A-Za-z0-9]+$/.test(user.id)) return null;

  const metadata = user.publicMetadata && typeof user.publicMetadata === "object" && !Array.isArray(user.publicMetadata)
    ? (user.publicMetadata as Record<string, unknown>) : {};
  const registry = metadata.registry && typeof metadata.registry === "object" && !Array.isArray(metadata.registry)
    ? metadata.registry as Record<string, unknown> : {};
  const rawRole = typeof registry.role === "string" ? registry.role : "";
  // Donor identities remain anonymous in the registry. Do not expose a donor's
  // Clerk account ID, email, display name or sign-in activity in administration.
  if (rawRole === "DONOR") return null;
  const role = ROLE_LABELS[rawRole] ?? "Unassigned";
  const institution = rawRole === "BANK" && typeof registry.bankId === "string" ? registry.bankId
    : rawRole === "HOSPITAL" && typeof registry.hospitalId === "string" ? registry.hospitalId
      : rawRole === "DONOR" ? "Anonymous donor"
        : rawRole === "STATE_ADMIN" ? "State-wide" : "—";

  const emails = Array.isArray(user.emailAddresses) ? user.emailAddresses as Array<{ id?: unknown; emailAddress?: unknown }> : [];
  const primary = emails.find(item => item.id === user.primaryEmailAddressId) ?? emails[0];
  const email = typeof primary?.emailAddress === "string" ? primary.emailAddress : "Not provided";
  const nameParts = [user.firstName, user.lastName].filter((part): part is string => typeof part === "string" && part.trim().length > 0);
  const name = nameParts.join(" ") || (typeof user.username === "string" && user.username.trim()) || "Unnamed account";
  const signInDate = typeof user.lastSignInAt === "number" && Number.isFinite(user.lastSignInAt) ? new Date(user.lastSignInAt) : null;
  const lastSignIn = signInDate && Number.isFinite(signInDate.getTime()) ? signInDate.toISOString() : null;

  return { id: user.id, name, email, role, institution, status: user.banned === true ? "Disabled" : user.locked === true ? "Locked" : "Active", lastSignIn };
}
