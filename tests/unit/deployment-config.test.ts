import { describe, expect, it } from "vitest";
import { validDatabaseName } from "../../src/server/database-config";
import { resolveStateId } from "../../src/server/registry-constants";

describe("deployment configuration", () => {
  it("accepts normal production database names and rejects invalid/reserved names", () => {
    for (const name of ["bloodbank", "bloodbank_prod", "bloodbank_preview_01", "pulsegrid_dev", "blood-bank-test"]) expect(validDatabaseName(name)).toBe(true);
    for (const name of ["", "admin", "LOCAL", "config", "bad.name", "bad/name", "bad\\name", "bad name", "bad$name", "a".repeat(64)]) expect(validDatabaseName(name)).toBe(false);
  });

  it("preserves the existing pilot partition by default and validates configured state IDs", () => {
    expect(resolveStateId(undefined)).toBe("maharashtra-pilot");
    expect(resolveStateId(" gujarat-prod ")).toBe("gujarat-prod");
    expect(() => resolveStateId("../other-state")).toThrow(/REGISTRY_STATE_ID/);
    expect(() => resolveStateId("state with spaces")).toThrow(/REGISTRY_STATE_ID/);
  });
});
