import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import type { AppUser } from "@/lib/ops-types";
import { clerkUserBelongsToState, clerkUserToAppUser } from "./clerk-directory-model";

const PAGE_SIZE = 100;
const MAX_USERS = 500;

export type ClerkDirectoryResult = {
  status: "available" | "unavailable";
  users: AppUser[];
  totalCount: number | null;
  truncated: boolean;
};

/** Read-only, state-admin-only caller. Returns only a bounded allowlisted projection. */
export async function readClerkDirectory(stateId: string): Promise<ClerkDirectoryResult> {
  try {
    const client = await clerkClient();
    const users: AppUser[] = [];
    let totalCount: number | null = null;
    let scannedCount = 0;
    for (let offset = 0; offset < MAX_USERS; offset += PAGE_SIZE) {
      const page = await client.users.getUserList({ limit: PAGE_SIZE, offset, orderBy: "-created_at" });
      totalCount = typeof page.totalCount === "number" ? page.totalCount : totalCount;
      scannedCount += page.data.length;
      users.push(...page.data.filter((entry: unknown) => clerkUserBelongsToState(entry, stateId)).map((entry: unknown) => clerkUserToAppUser(entry)).filter((user: AppUser | null): user is AppUser => user !== null));
      if (page.data.length < PAGE_SIZE || (totalCount !== null && offset + page.data.length >= totalCount)) break;
    }
    const truncated = totalCount !== null ? totalCount > scannedCount : scannedCount >= MAX_USERS;
    return { status: "available", users, totalCount: truncated ? null : users.length, truncated };
  } catch {
    // Do not leak Clerk response bodies, tokens, email addresses or request details.
    return { status: "unavailable", users: [], totalCount: null, truncated: false };
  }
}
