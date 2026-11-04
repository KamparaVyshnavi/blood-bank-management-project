import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn() }));
import { clerkClient } from "@clerk/nextjs/server";
import { readClerkDirectory } from "../../src/server/clerk-directory";

const clientMock = vi.mocked(clerkClient);
const account = (id: string, stateId: string) => ({
  id,
  firstName: id,
  emailAddresses: [{ id: `email-${id}`, emailAddress: `${id}@example.test` }],
  primaryEmailAddressId: `email-${id}`,
  publicMetadata: { registry: { role: "BANK", stateId, bankId: `bank-${id}`, tenantId: `tenant-${id}` } },
});

beforeEach(() => vi.clearAllMocks());

describe("Clerk directory service", () => {
  it("paginates a bounded directory and excludes accounts from other state partitions", async () => {
    const getUserList = vi.fn()
      .mockResolvedValueOnce({ data: [account("user_1", "maharashtra-pilot"), account("user_2", "other-state"), { id: "user_donor", emailAddresses: [{ emailAddress: "donor@example.test" }], publicMetadata: { registry: { role: "DONOR", stateId: "maharashtra-pilot", donorId: "private-donor" } } }], totalCount: 3 });
    clientMock.mockResolvedValue({ users: { getUserList } } as never);
    const result = await readClerkDirectory("maharashtra-pilot");
    expect(result).toMatchObject({ status: "available", totalCount: 1, truncated: false });
    expect(result.users.map(user => user.id)).toEqual(["user_1"]);
    expect(getUserList).toHaveBeenCalledWith({ limit: 100, offset: 0, orderBy: "-created_at" });
    expect(JSON.stringify(result)).not.toContain("tenant-user_1");
    expect(JSON.stringify(result)).not.toContain("donor@example.test");
    expect(JSON.stringify(result)).not.toContain("private-donor");
  });

  it("returns a safe unavailable result when Clerk cannot be reached", async () => {
    clientMock.mockRejectedValue(new Error("secret provider response"));
    const result = await readClerkDirectory("maharashtra-pilot");
    expect(result).toEqual({ status: "unavailable", users: [], totalCount: null, truncated: false });
    expect(JSON.stringify(result)).not.toContain("secret");
  });
});
