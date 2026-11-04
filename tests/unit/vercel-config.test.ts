import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Vercel deployment configuration", () => {
  it("keeps the Node 24 runtime, Mumbai region, clean install and Next build aligned", () => {
    const root = process.cwd();
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as { name: string; engines?: { node?: string }; scripts?: Record<string, string> };
    const lock = JSON.parse(readFileSync(resolve(root, "package-lock.json"), "utf8")) as { name: string; packages?: { ""?: { name?: string } } };
    const vercel = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8")) as { framework?: string; regions?: string[]; installCommand?: string; buildCommand?: string };
    expect(readFileSync(resolve(root, ".nvmrc"), "utf8").trim()).toBe("24");
    expect(pkg.engines?.node).toBe("24.x");
    expect(pkg.name).toBe("blood-bank-management-system");
    expect(lock.name).toBe(pkg.name);
    expect(lock.packages?.[""]?.name).toBe(pkg.name);
    expect(vercel).toMatchObject({ framework: "nextjs", regions: ["bom1"], installCommand: "npm ci", buildCommand: "npm run build" });
  });
});
