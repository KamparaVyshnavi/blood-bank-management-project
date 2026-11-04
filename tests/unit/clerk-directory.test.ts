import { describe, expect, it } from "vitest";
import { clerkUserBelongsToState, clerkUserToAppUser } from "../../src/server/clerk-directory-model";

describe("Clerk directory projection", () => {
  it("filters the directory to the active state partition", () => {
    expect(clerkUserBelongsToState({ publicMetadata: { registry: { stateId: "maharashtra-pilot" } } }, "maharashtra-pilot")).toBe(true);
    expect(clerkUserBelongsToState({ publicMetadata: { registry: { stateId: "other-state" } } }, "maharashtra-pilot")).toBe(false);
    expect(clerkUserBelongsToState({ publicMetadata: {} }, "maharashtra-pilot")).toBe(false);
  });

  it("maps only the supported registry role and membership identifier", () => {
    const user = clerkUserToAppUser({
      id: "user_123456789",
      firstName: "Asha",
      lastName: "Patel",
      emailAddresses: [{ id: "email_1", emailAddress: "asha@example.test" }],
      primaryEmailAddressId: "email_1",
      publicMetadata: { registry: { role: "BANK", stateId: "maharashtra-pilot", bankId: "bank-17", tenantId: "private-tenant" }, unrelated: "private" },
      lastSignInAt: 1_798_000_000_000,
      banned: false,
      phoneNumbers: [{ phoneNumber: "+910000000000" }],
    });
    expect(user).toMatchObject({ id: "user_123456789", name: "Asha Patel", email: "asha@example.test", role: "Blood bank", institution: "bank-17", status: "Active" });
    expect(user && Object.keys(user)).toEqual(["id", "name", "email", "role", "institution", "status", "lastSignIn"]);
    expect(JSON.stringify(user)).not.toContain("private-tenant");
    expect(JSON.stringify(user)).not.toContain("+910000000000");
  });

  it("does not invent a registry role or institution for unassigned accounts", () => {
    expect(clerkUserToAppUser({ id: "user_123", emailAddresses: [], publicMetadata: {} })).toMatchObject({ role: "Unassigned", institution: "—", email: "Not provided", status: "Active", lastSignIn: null });
  });

  it("distinguishes Clerk-banned and locked accounts and rejects malformed users", () => {
    expect(clerkUserToAppUser({ id: "user_123", banned: true })?.status).toBe("Disabled");
    expect(clerkUserToAppUser({ id: "user_123", locked: true })?.status).toBe("Locked");
    expect(clerkUserToAppUser({ id: "not-a-clerk-user" })).toBeNull();
    expect(clerkUserToAppUser(null)).toBeNull();
  });
});
