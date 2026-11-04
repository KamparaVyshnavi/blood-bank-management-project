import { describe, expect, it } from "vitest";
import { getInventory, getReports } from "../../src/lib/ops-data";

describe("operations demo data consistency", () => {
  it("keeps collection and expiry dates consistent with each unit status", async () => {
    const inventory = await getInventory();

    for (const unit of inventory.units) {
      const collectedAt = Date.parse(unit.collectedOn);
      const expiresAt = Date.parse(unit.expiresOn);

      expect(Number.isFinite(collectedAt)).toBe(true);
      expect(Number.isFinite(expiresAt)).toBe(true);
      expect(collectedAt).toBeLessThanOrEqual(inventory.now);
      expect(expiresAt).toBeGreaterThan(collectedAt);

      if (unit.status === "Expired") expect(expiresAt).toBeLessThanOrEqual(inventory.now);
      if (unit.status === "Available" || unit.status === "Reserved") expect(expiresAt).toBeGreaterThan(inventory.now);
    }
  });

  it("derives report totals from inventory and excludes active partial requests from closed outcomes", async () => {
    const [inventory, report] = await Promise.all([getInventory(), getReports()]);
    const terminal = report.emergencies.filter(item => ["Fulfilled", "Rejected", "Cancelled"].includes(item.status));
    const fulfilled = terminal.filter(item => item.status === "Fulfilled").length;

    expect(report.cards.collected).toBe(inventory.units.length);
    expect(report.cards.issued).toBe(inventory.units.filter(unit => unit.status === "Issued").length);
    expect(report.cards.fulfilmentRate).toBe(terminal.length ? Math.round((fulfilled / terminal.length) * 100) : 0);
  });
});
