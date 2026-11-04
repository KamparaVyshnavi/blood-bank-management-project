import { BLOOD_GROUPS, type BankResponse, type BloodComponent, type BloodGroup, type BloodUnit, type Donor, type Emergency, type EmergencyStatus, type Institution, type UnitStatus, type Urgency } from "./ops-types";

type Row = Record<string, unknown>;
const text = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
export function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  return "";
}
export function componentLabel(value: unknown): BloodComponent {
  if (value === "PRBC") return "Red cells";
  if (value === "FFP") return "Plasma";
  if (value === "PLATELETS") return "Platelets";
  throw new Error("Unsupported blood component in persisted record");
}
export function unitStatusLabel(value: unknown): UnitStatus {
  const labels: Record<string, UnitStatus> = {
    COLLECTED: "Collected", TESTING: "Testing", AVAILABLE: "Available", RESERVED: "Reserved",
    ISSUED: "Issued", TRANSFUSED: "Transfused", EXPIRED: "Expired", DISCARDED: "Discarded",
    RETURNED_QUARANTINE: "Returned to quarantine", QUARANTINED: "Quarantined",
  };
  const result = typeof value === "string" ? labels[value] : undefined;
  if (!result) throw new Error("Unsupported blood unit lifecycle status");
  return result;
}
export function urgencyLabel(value: unknown): Urgency {
  if (value === "CRITICAL") return "Critical";
  if (value === "URGENT") return "High";
  if (value === "ROUTINE") return "Normal";
  throw new Error("Unsupported request urgency");
}
export function emergencyStatusLabel(status: unknown, workflowStatus?: unknown): EmergencyStatus {
  switch (status) {
    case "OPEN": return workflowStatus === "PENDING" || workflowStatus == null ? "Submitted" : ["AWAITING_DONORS", "AWAITING_DONOR_RESPONSES", "AWAITING_BANK_APPROVAL"].includes(String(workflowStatus)) ? "Awaiting response" : "Processing";
    case "PARTIAL": return "Partially allocated";
    case "ALLOCATED": return "Allocated";
    case "COMPLETED": return "Fulfilled";
    case "CANCELLED": return "Cancelled";
    case "ESCALATED": return "Escalated";
    case "FAILED": return "Failed";
    default: throw new Error("Unsupported persisted request status");
  }
}
export function unitFromRecord(row: Row, institutionName: string): BloodUnit {
  const groupValue = text(row.group);
  const group = groupValue as BloodGroup;
  const collectedOn = asIso(row.collectedAt), expiresOn = asIso(row.expiresAt);
  if (!text(row.id) || !BLOOD_GROUPS.includes(group) || !collectedOn || !expiresOn || Date.parse(expiresOn) <= Date.parse(collectedOn)) throw new Error("Persisted unit is missing valid required fields");
  return { id: text(row.id), group, component: componentLabel(row.component), collectedOn, expiresOn, status: unitStatusLabel(row.status), institutionId: text(row.bankId), institution: institutionName };
}
export function institutionFromRecord(row: Row, type: "Hospital" | "Blood bank"): Institution {
  if (!text(row.id) || !text(row.name)) throw new Error("Persisted institution is missing its identity fields");
  return {
    id: text(row.id), name: text(row.name), type,
    district: text(row.district, "Not recorded"), state: "Not recorded",
    regId: "Not recorded", contact: "Not recorded", status: "Not recorded",
    lastActivity: "", admins: [],
  };
}
export function donorFromRecord(row: Row, counts: { sent?: number; answered?: number } = {}): Donor {
  const eligibleFrom = asIso(row.eligibleFrom);
  const group = text(row.group) as BloodGroup;
  if (!text(row.id) || !text(row.nickname) || !BLOOD_GROUPS.includes(group) || !eligibleFrom) throw new Error("Persisted donor is missing valid anonymous registry fields");
  return { id: text(row.id), nickname: text(row.nickname), group, eligibleFrom, lastDonationAt: row.lastDonationAt ? asIso(row.lastDonationAt) || null : null, alertsEnabled: row.audience === true, alertsSent: counts.sent ?? 0, alertsAnswered: counts.answered ?? 0 };
}
export function emergencyFromRecord(row: Row, hospitalName: string, district: string, responses: BankResponse[] = []): Emergency {
  const createdAt = asIso(row.createdAt), deadline = asIso(row.expectedTransfusionAt);
  const quantity = row.quantity, transfusedQuantity = row.transfusedQuantity ?? 0;
  if (!text(row.id) || !text(row.hospitalId) || !BLOOD_GROUPS.includes(text(row.group) as BloodGroup) || !createdAt || !deadline || typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1 || typeof transfusedQuantity !== "number" || !Number.isSafeInteger(transfusedQuantity) || transfusedQuantity < 0 || transfusedQuantity > quantity) throw new Error("Persisted request is missing valid required fields");
  const workflow = row.workflow && typeof row.workflow === "object" ? row.workflow as Row : undefined;
  const trace = Array.isArray(workflow?.trace) ? workflow!.trace as Row[] : [];
  const completedEvent = [...trace].reverse().find(event => event.status === "COMPLETED");
  return {
    id: text(row.id), hospitalId: text(row.hospitalId), hospital: hospitalName, district,
    group: text(row.group) as BloodGroup, component: componentLabel(row.component),
    units: quantity, unitsFulfilled: transfusedQuantity,
    urgency: urgencyLabel(row.urgency), status: emergencyStatusLabel(row.status, workflow?.status),
    createdAt, deadline, completedAt: completedEvent ? asIso(completedEvent.at) || null : null, responses,
    timeline: trace.map(event => ({ label: text(event.status), at: asIso(event.at) })).filter(event => event.at),
  };
}
