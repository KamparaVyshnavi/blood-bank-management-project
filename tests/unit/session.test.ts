import { describe, expect, it } from "vitest";
import { navigationRole } from "../../src/lib/session";
import { adminNav, labsNav, primaryNav, visible } from "../../src/components/ds/nav";

describe("navigation role parsing", () => {
  it.each(["STATE_ADMIN", "BANK", "HOSPITAL", "DONOR"] as const)("accepts the server role %s", role => {
    expect(navigationRole({ registry: { role } })).toBe(role);
  });

  it.each([undefined, null, {}, [], { registry: null }, { registry: { role: "BLOOD_BANK" } }, { registry: { role: "SUPER_ADMIN" } }])("rejects malformed or unsupported metadata", metadata => {
    expect(navigationRole(metadata)).toBeNull();
  });
});

describe("role-aware navigation", () => {
  it("does not show privileged links before identity is known", () => {
    expect(visible(adminNav, null)).toEqual([]);
    expect(visible([labsNav], null)).toEqual([]);
    expect(visible(primaryNav, null).some(item => item.href === "/donors")).toBe(false);
  });

  it("shows administration only to state administrators and donor tools only to bank/admin", () => {
    expect(visible(adminNav, "STATE_ADMIN")).toHaveLength(1);
    expect(visible(adminNav, "BANK")).toHaveLength(0);
    expect(visible(primaryNav, "HOSPITAL").some(item => item.href === "/donors")).toBe(false);
    expect(visible(primaryNav, "BANK").some(item => item.href === "/donors")).toBe(true);
  });
});
