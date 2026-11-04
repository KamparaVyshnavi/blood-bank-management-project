import { describe, expect, it } from "vitest";
import { groupRows } from "../../src/lib/inventory-math";
import { componentLabel, donorFromRecord, emergencyFromRecord, emergencyStatusLabel, institutionFromRecord, unitFromRecord, unitStatusLabel, urgencyLabel } from "../../src/lib/ops-adapters";

describe("operational backend adapters", () => {
  it("maps only backend-supported blood components", () => {
    expect(componentLabel("PRBC")).toBe("Red cells");
    expect(componentLabel("FFP")).toBe("Plasma");
    expect(componentLabel("PLATELETS")).toBe("Platelets");
    expect(() => componentLabel("WHOLE_BLOOD")).toThrow();
  });

  it("preserves every persisted clinical lifecycle state", () => {
    const statuses = ["COLLECTED", "TESTING", "AVAILABLE", "RESERVED", "ISSUED", "TRANSFUSED", "EXPIRED", "DISCARDED", "RETURNED_QUARANTINE", "QUARANTINED"];
    expect(statuses.map(unitStatusLabel)).toEqual(["Collected", "Testing", "Available", "Reserved", "Issued", "Transfused", "Expired", "Discarded", "Returned to quarantine", "Quarantined"]);
    expect(() => unitStatusLabel("PENDING")).toThrow();
  });

  it("maps persisted request status and urgency without inventing rejected states", () => {
    expect(emergencyStatusLabel("OPEN", "PENDING")).toBe("Submitted");
    expect(emergencyStatusLabel("OPEN", "STOCK_SEARCH")).toBe("Processing");
    expect(emergencyStatusLabel("OPEN", "AWAITING_DONORS")).toBe("Awaiting response");
    expect(emergencyStatusLabel("PARTIAL")).toBe("Partially allocated");
    expect(emergencyStatusLabel("ALLOCATED")).toBe("Allocated");
    expect(emergencyStatusLabel("COMPLETED")).toBe("Fulfilled");
    expect(emergencyStatusLabel("ESCALATED")).toBe("Escalated");
    expect(emergencyStatusLabel("FAILED")).toBe("Failed");
    expect(emergencyStatusLabel("CANCELLED")).toBe("Cancelled");
    expect(() => emergencyStatusLabel("REJECTED")).toThrow();
    expect(urgencyLabel("ROUTINE")).toBe("Normal");
    expect(urgencyLabel("URGENT")).toBe("High");
    expect(urgencyLabel("CRITICAL")).toBe("Critical");
  });

  it("counts only in-date, already-collected available stock", () => {
    const now = Date.parse("2026-11-04T00:00:00Z");
    const units = [
      { id: "valid", group: "O-" as const, component: "Red cells" as const, collectedOn: "2026-11-01T00:00:00Z", expiresOn: "2026-11-10T00:00:00Z", status: "Available" as const, institutionId: "b", institution: "Bank" },
      { id: "expired", group: "O-" as const, component: "Red cells" as const, collectedOn: "2026-10-01T00:00:00Z", expiresOn: "2026-11-03T00:00:00Z", status: "Available" as const, institutionId: "b", institution: "Bank" },
      { id: "future", group: "O-" as const, component: "Red cells" as const, collectedOn: "2026-11-05T00:00:00Z", expiresOn: "2026-11-15T00:00:00Z", status: "Available" as const, institutionId: "b", institution: "Bank" },
    ];
    expect(groupRows(units, now).find(row => row.group === "O-")?.available).toBe(1);
  });

  it("keeps donor profiles anonymous and omits private source fields", () => {
    const donor = donorFromRecord({ id: "donor-1", nickname: "River", group: "O-", eligibleFrom: new Date("2026-11-01T00:00:00Z"), lastDonationAt: new Date("2026-08-01T00:00:00Z"), audience: true, name: "Real Name", phone: "+9100000000", location: { type: "Point", coordinates: [73, 18] }, sessionHash: "secret" }, { sent: 4, answered: 2 });
    expect(donor).toMatchObject({ id: "donor-1", nickname: "River", group: "O-", alertsEnabled: true, alertsSent: 4, alertsAnswered: 2 });
    expect(Object.keys(donor)).not.toContain("name");
    expect(Object.keys(donor)).not.toContain("phone");
    expect(Object.keys(donor)).not.toContain("location");
    expect(Object.keys(donor)).not.toContain("sessionHash");
  });

  it("maps persisted emergency request fields and workflow trace", () => {
    const emergency = emergencyFromRecord({ id: "req-1", hospitalId: "hospital-1", group: "O-", component: "PRBC", quantity: 3, transfusedQuantity: 1, urgency: "CRITICAL", status: "PARTIAL", expectedTransfusionAt: new Date("2026-11-04T12:00:00Z"), createdAt: new Date("2026-11-04T10:00:00Z"), workflow: { status: "ALLOCATING", trace: [{ status: "STOCK_SEARCH", at: new Date("2026-11-04T10:01:00Z") }] } }, "Hospital 1", "Pune", [{ institutionId: "bank-1", bank: "Bank 1", state: "Reserved", unitsOffered: 1, at: "2026-11-04T10:02:00.000Z" }]);
    expect(emergency).toMatchObject({ id: "req-1", hospital: "Hospital 1", component: "Red cells", units: 3, unitsFulfilled: 1, urgency: "Critical", status: "Partially allocated" });
    expect(emergency.timeline).toEqual([{ label: "STOCK_SEARCH", at: "2026-11-04T10:01:00.000Z" }]);
    expect(emergency.responses).toMatchObject([{ bank: "Bank 1", state: "Reserved", unitsOffered: 1 }]);
    const completed = emergencyFromRecord({ id: "req-2", hospitalId: "hospital-1", group: "O-", component: "PRBC", quantity: 1, transfusedQuantity: 1, urgency: "URGENT", status: "COMPLETED", expectedTransfusionAt: new Date("2026-11-04T12:00:00Z"), createdAt: new Date("2026-11-04T10:00:00Z"), workflow: { trace: [{ status: "COMPLETED", at: new Date("2026-11-04T11:00:00Z") }] } }, "Hospital 1", "Pune");
    expect(completed.completedAt).toBe("2026-11-04T11:00:00.000Z");
  });

  it("adapts persisted unit timestamps and institution records without fabricating PII or approval data", () => {
    const unit = unitFromRecord({ id: "unit-1", bankId: "bank-1", group: "O-", component: "PRBC", collectedAt: new Date("2026-01-01T00:00:00Z"), expiresAt: new Date("2026-02-01T00:00:00Z"), status: "AVAILABLE" }, "Bank 1");
    expect(unit.collectedOn).toBe("2026-01-01T00:00:00.000Z");
    expect(unit.component).toBe("Red cells");
    const institution = institutionFromRecord({ id: "bank-1", name: "Bank 1", district: "Pune" }, "Blood bank");
    expect(institution.status).toBe("Not recorded");
    expect(institution.contact).toBe("Not recorded");
    expect(institution.admins).toEqual([]);
  });
});
