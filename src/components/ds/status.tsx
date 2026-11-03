import { StatusBadge, type StatusTone } from "../ui/status-badge";
import type { EmergencyStatus, InstitutionStatus, UnitStatus, Urgency } from "@/lib/ops-types";

const emergencyTone: Record<EmergencyStatus, StatusTone> = { Submitted: "info", Processing: "info", "Awaiting response": "low", "Partially fulfilled": "low", Fulfilled: "healthy", Rejected: "critical", Cancelled: "neutral" };
const unitTone: Record<UnitStatus, StatusTone> = { Available: "healthy", Reserved: "info", Issued: "neutral", Expired: "critical", Discarded: "critical" };
const instTone: Record<InstitutionStatus, StatusTone> = { Active: "healthy", Pending: "low", Suspended: "critical" };
const urgencyTone: Record<Urgency, StatusTone> = { Critical: "critical", High: "low", Normal: "neutral" };

export const EmergencyStatusBadge = ({ status }: { status: EmergencyStatus }) => <StatusBadge tone={emergencyTone[status]}>{status}</StatusBadge>;
export const UnitStatusBadge = ({ status }: { status: UnitStatus }) => <StatusBadge tone={unitTone[status]}>{status}</StatusBadge>;
export const InstitutionStatusBadge = ({ status }: { status: InstitutionStatus }) => <StatusBadge tone={instTone[status]}>{status}</StatusBadge>;
export const UrgencyBadge = ({ urgency }: { urgency: Urgency }) => <StatusBadge tone={urgencyTone[urgency]}>{urgency}</StatusBadge>;
export const LevelBadge = ({ level }: { level: "ok" | "low" | "critical" }) => <StatusBadge tone={level === "ok" ? "healthy" : level === "low" ? "low" : "critical"}>{level === "ok" ? "Healthy" : level === "low" ? "Low stock" : "Critical"}</StatusBadge>;
export const BloodTag = ({ group }: { group: string }) => <span className="ds-blood">{group}</span>;
