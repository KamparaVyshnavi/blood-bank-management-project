import { afterEach, describe, expect, it, vi } from "vitest";
import { databaseName } from "../../src/server/mongodb";
import { RegistryError } from "../../src/server/errors";

afterEach(() => vi.unstubAllEnvs());

describe("MongoDB runtime database configuration", () => {
  it("accepts production database names without forcing a demo prefix", () => {
    vi.stubEnv("MONGODB_DB_NAME", "bloodbank_prod");
    expect(databaseName()).toBe("bloodbank_prod");
  });

  it("trims whitespace and rejects reserved, malformed or missing names", () => {
    vi.stubEnv("MONGODB_DB_NAME", "  bloodbank_preview  ");
    expect(databaseName()).toBe("bloodbank_preview");
    for (const value of ["admin", "local", "config", "bad/name", "bad.name", "a".repeat(64), ""]) {
      vi.stubEnv("MONGODB_DB_NAME", value);
      expect(() => databaseName()).toThrow(RegistryError);
    }
    vi.stubEnv("MONGODB_DB_NAME", "");
    expect(() => databaseName()).toThrow(RegistryError);
  });
});
