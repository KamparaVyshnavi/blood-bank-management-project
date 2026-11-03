export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export const COMPONENTS = ["Whole blood", "Red cells", "Plasma", "Platelets"] as const;
export type BloodComponent = (typeof COMPONENTS)[number];

export const UNIT_STATUSES = ["Available", "Reserved", "Issued", "Expired", "Discarded"] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];
export type BloodUnit = { id: string; group: BloodGroup; component: BloodComponent; collectedOn: string; expiresOn: string; status: UnitStatus; institutionId: string; institution: string };
export type GroupRow = { group: BloodGroup; available: number; reserved: number; expiringSoon: number; level: "ok" | "low" | "critical" };

export const URGENCIES = ["Critical", "High", "Normal"] as const;
export type Urgency = (typeof URGENCIES)[number];
export const EMERGENCY_STATUSES = ["Submitted", "Processing", "Awaiting response", "Partially fulfilled", "Fulfilled", "Rejected", "Cancelled"] as const;
export type EmergencyStatus = (typeof EMERGENCY_STATUSES)[number];
export type TimelineEvent = { label: string; detail?: string; at: string };
export type BankResponse = { institutionId: string; bank: string; state: "Contacted" | "Offered" | "Reserved" | "Dispatched" | "Declined"; unitsOffered: number; at: string };
export type Emergency = {
  id: string; hospitalId: string; hospital: string; district: string; group: BloodGroup; component: BloodComponent;
  units: number; unitsFulfilled: number; urgency: Urgency; status: EmergencyStatus; createdAt: string; deadline: string;
  responses: BankResponse[]; timeline: TimelineEvent[];
};

export type InstitutionType = "Hospital" | "Blood bank";
export type InstitutionStatus = "Active" | "Pending" | "Suspended";
export type Institution = { id: string; name: string; type: InstitutionType; regId: string; district: string; state: string; contact: string; status: InstitutionStatus; lastActivity: string; admins: string[] };

export type Donor = { id: string; name: string; group: BloodGroup; district: string; available: boolean; subscribed: boolean; verified: boolean; lastDonation: string | null; nextEligible: string | null; contactMasked: string; alertsSent: number; alertsAnswered: number };

export type Activity = { id: string; text: string; institution: string; at: string; tone: "ok" | "info" | "warn" | "critical" };
export type PendingAction = { id: string; action: string; owner: string; due: string; href: string };

export type AuditEntry = { id: string; user: string; action: string; record: string; at: string; result: "Success" | "Denied" | "Failed" };
export type AppUser = { id: string; name: string; email: string; role: "State admin" | "Blood bank" | "Hospital" | "Donor"; institution: string; status: "Active" | "Disabled"; lastSignIn: string | null };
