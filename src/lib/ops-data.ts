/**
 * DATA LAYER — the only file the screens read from.
 *
 * Everything here is placeholder data so the frontend can be finished and reviewed
 * before the backend is connected. To go live, replace the body of each exported
 * `get*` function with a call to the real API/server module and keep the return types
 * (see ops-types.ts). No screen imports the sample arrays directly.
 */
import { groupRows as groupRowsAt, expiringSoon as expiringSoonAt } from "./inventory-math";
import { BLOOD_GROUPS, COMPONENTS, type Activity, type AppUser, type AuditEntry, type BankResponse, type BloodComponent, type BloodGroup, type BloodUnit, type Donor, type Emergency, type EmergencyStatus, type Institution, type PendingAction, type TimelineEvent, type UnitStatus, type Urgency } from "./ops-types";

const NOW = Date.now();
const H = 3600000, D = 24 * H;
const at = (hoursFromNow: number) => new Date(NOW + hoursFromNow * H).toISOString();

// Small deterministic PRNG so the sample data is stable between renders.
function rng(seed: number) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }

/* ---------- Institutions ---------- */
const institutions: Institution[] = [
  { id: "bb-harbour", name: "Harbour City Blood Bank", type: "Blood bank", regId: "MH-BB-0112", district: "Mumbai City", state: "Maharashtra", contact: "+91 22 5550 0112", status: "Active", lastActivity: at(-0.4), admins: ["R. Kulkarni", "S. Fernandes"] },
  { id: "bb-western", name: "Western Suburbs Blood Centre", type: "Blood bank", regId: "MH-BB-0147", district: "Mumbai Suburban", state: "Maharashtra", contact: "+91 22 5550 0147", status: "Active", lastActivity: at(-1.2), admins: ["A. Deshmukh"] },
  { id: "bb-thane", name: "Thane Regional Blood Bank", type: "Blood bank", regId: "MH-BB-0203", district: "Thane", state: "Maharashtra", contact: "+91 22 5550 0203", status: "Active", lastActivity: at(-3), admins: ["M. Shaikh"] },
  { id: "bb-pune", name: "Pune Central Blood Bank", type: "Blood bank", regId: "MH-BB-0318", district: "Pune", state: "Maharashtra", contact: "+91 20 5550 0318", status: "Active", lastActivity: at(-0.8), admins: ["P. Joshi", "N. Iyer"] },
  { id: "bb-eastern", name: "Eastern Link Blood Bank", type: "Blood bank", regId: "MH-BB-0355", district: "Thane", state: "Maharashtra", contact: "+91 22 5550 0355", status: "Pending", lastActivity: at(-52), admins: ["V. Patil"] },
  { id: "h-city", name: "City General Hospital", type: "Hospital", regId: "MH-H-1021", district: "Mumbai City", state: "Maharashtra", contact: "+91 22 5551 1021", status: "Active", lastActivity: at(-0.2), admins: ["Dr. T. Menon"] },
  { id: "h-lotus", name: "Lotus Multispeciality Hospital", type: "Hospital", regId: "MH-H-1064", district: "Mumbai Suburban", state: "Maharashtra", contact: "+91 22 5551 1064", status: "Active", lastActivity: at(-1.7), admins: ["Dr. K. Rao"] },
  { id: "h-sahyadri", name: "Sahyadri Trauma Centre", type: "Hospital", regId: "MH-H-1130", district: "Pune", state: "Maharashtra", contact: "+91 20 5551 1130", status: "Active", lastActivity: at(-0.5), admins: ["Dr. L. Bhosale"] },
  { id: "h-creek", name: "Creekside Medical Centre", type: "Hospital", regId: "MH-H-1177", district: "Thane", state: "Maharashtra", contact: "+91 22 5551 1177", status: "Active", lastActivity: at(-6), admins: ["Dr. F. Khan"] },
  { id: "h-rural", name: "Taluka Rural Hospital", type: "Hospital", regId: "MH-H-1209", district: "Pune", state: "Maharashtra", contact: "+91 20 5551 1209", status: "Suspended", lastActivity: at(-240), admins: ["Dr. G. More"] },
];
const banks = institutions.filter(i => i.type === "Blood bank");
const hospitals = institutions.filter(i => i.type === "Hospital");
const inst = (id: string) => institutions.find(i => i.id === id)!;

/* ---------- Blood units (inventory is always derived from these) ---------- */
const GROUP_WEIGHTS: Record<BloodGroup, number> = { "B+": 32, "O+": 30, "A+": 22, "AB+": 8, "O-": 3, "A-": 2, "B-": 2, "AB-": 1 };
const SHELF: Record<BloodComponent, number> = { "Whole blood": 35, "Red cells": 42, "Plasma": 365, "Platelets": 5 };
function buildUnits(): BloodUnit[] {
  const r = rng(11);
  const pickGroup = () => { let x = r() * 100; for (const g of BLOOD_GROUPS) { x -= GROUP_WEIGHTS[g]; if (x <= 0) return g; } return "O+" as BloodGroup; };
  const out: BloodUnit[] = [];
  for (let i = 1; i <= 230; i++) {
    const group = pickGroup();
    const component = COMPONENTS[Math.floor(r() * r() * COMPONENTS.length)]; // skew toward whole blood / red cells
    const bank = banks[Math.floor(r() * 4)];
    const age = Math.floor(r() * SHELF[component] * 0.95) - (r() < 0.04 ? 2 : 0);
    const expiresOn = new Date(NOW + (SHELF[component] - age) * D).toISOString();
    const collectedOn = new Date(NOW - age * D).toISOString();
    const roll = r();
    let status: UnitStatus = roll < 0.74 ? "Available" : roll < 0.86 ? "Reserved" : roll < 0.95 ? "Issued" : roll < 0.98 ? "Discarded" : "Expired";
    if (Date.parse(expiresOn) < NOW && status === "Available") status = "Expired";
    out.push({ id: `U-${String(24000 + i)}`, group, component, collectedOn, expiresOn, status, institutionId: bank.id, institution: bank.name });
  }
  // Make a couple of groups realistically scarce so the alerts have something to say.
  return out.filter(u => !(u.group === "AB-" && u.status === "Available" && Number(u.id.slice(2)) % 3 !== 0));
}
const units = buildUnits();
const expiringSoon = (u: BloodUnit) => expiringSoonAt(u, NOW);
const groupRows = (list: BloodUnit[]) => groupRowsAt(list, NOW);

/* ---------- Emergencies ---------- */
type Seed = [id: string, hospital: string, group: BloodGroup, comp: BloodComponent, units: number, urg: Urgency, status: EmergencyStatus, createdHrsAgo: number, dueInHrs: number, fulfilled: number];
const seeds: Seed[] = [
  ["ER-1048", "h-sahyadri", "O-", "Red cells", 4, "Critical", "Awaiting response", 0.3, 1.5, 0],
  ["ER-1047", "h-city", "B+", "Platelets", 6, "Critical", "Processing", 0.8, 2.5, 0],
  ["ER-1046", "h-lotus", "A+", "Red cells", 3, "High", "Partially fulfilled", 2.2, 5, 2],
  ["ER-1045", "h-creek", "AB-", "Plasma", 2, "High", "Awaiting response", 3.1, 6, 0],
  ["ER-1044", "h-city", "O+", "Whole blood", 2, "Normal", "Fulfilled", 5, 8, 2],
  ["ER-1043", "h-sahyadri", "B-", "Red cells", 2, "Critical", "Partially fulfilled", 6, 1, 1],
  ["ER-1042", "h-lotus", "O+", "Red cells", 5, "High", "Fulfilled", 9, 12, 5],
  ["ER-1041", "h-creek", "A-", "Plasma", 1, "Normal", "Rejected", 14, 20, 0],
  ["ER-1040", "h-city", "B+", "Red cells", 3, "Normal", "Fulfilled", 20, 24, 3],
  ["ER-1039", "h-lotus", "AB+", "Platelets", 2, "High", "Cancelled", 26, 30, 0],
  ["ER-1038", "h-sahyadri", "O+", "Red cells", 4, "High", "Fulfilled", 30, 34, 4],
  ["ER-1037", "h-creek", "A+", "Whole blood", 2, "Normal", "Fulfilled", 44, 48, 2],
];
function buildEmergency([id, hid, group, component, qty, urgency, status, ago, due, fulfilled]: Seed): Emergency {
  const h = inst(hid);
  const created = at(-ago);
  const nearby = banks.filter(b => b.status === "Active").slice(0, status === "Submitted" ? 0 : 3);
  const responses: BankResponse[] = nearby.map((b, i) => {
    const state: BankResponse["state"] = status === "Awaiting response" ? (i === 0 ? "Offered" : "Contacted") : status === "Processing" ? "Contacted" : status === "Rejected" ? "Declined" : status === "Cancelled" ? "Contacted" : i === 0 ? (status === "Fulfilled" ? "Dispatched" : "Reserved") : i === 1 && fulfilled > 0 && status === "Partially fulfilled" ? "Reserved" : "Declined";
    return { institutionId: b.id, bank: b.name, state, unitsOffered: state === "Offered" || state === "Reserved" || state === "Dispatched" ? Math.max(1, i === 0 ? Math.min(qty, Math.max(fulfilled, 1)) : 1) : 0, at: new Date(Date.parse(created) + (6 + i * 9) * 60000).toISOString() };
  });
  const t = (min: number) => new Date(Date.parse(created) + min * 60000).toISOString();
  const timeline: TimelineEvent[] = [{ label: "Request created", detail: `${h.name} requested ${qty} × ${group} ${component.toLowerCase()}`, at: created }];
  if (status !== "Submitted") timeline.push({ label: "Request validated", at: t(2) });
  if (responses.length) timeline.push({ label: "Blood banks contacted", detail: `${responses.length} banks in range`, at: t(4) });
  if (responses.some(r => r.state === "Offered" || r.state === "Reserved" || r.state === "Dispatched")) timeline.push({ label: "Blood bank response", detail: `${responses.find(r => r.unitsOffered)?.bank} offered ${responses.find(r => r.unitsOffered)?.unitsOffered} unit(s)`, at: t(12) });
  if (responses.some(r => r.state === "Reserved" || r.state === "Dispatched")) timeline.push({ label: "Units reserved", detail: `${Math.max(fulfilled, 1)} unit(s) held`, at: t(20) });
  if (status === "Fulfilled") timeline.push({ label: "Dispatched and received", at: t(55) }, { label: "Request completed", at: t(70) });
  if (status === "Rejected") timeline.push({ label: "Request rejected", detail: "No compatible stock within range", at: t(25) });
  if (status === "Cancelled") timeline.push({ label: "Request cancelled", detail: "Cancelled by the hospital", at: t(40) });
  return { id, hospitalId: hid, hospital: h.name, district: h.district, group, component, units: qty, unitsFulfilled: fulfilled, urgency, status, createdAt: created, deadline: at(due - ago + ago), responses, timeline };
}
const emergencies = seeds.map(buildEmergency);
const OPEN: EmergencyStatus[] = ["Submitted", "Processing", "Awaiting response", "Partially fulfilled"];
const isOpen = (e: Emergency) => OPEN.includes(e.status);

/* ---------- Donors ---------- */
const donorNames = ["Aarav Mehta", "Diya Nair", "Kabir Sheikh", "Isha Kulkarni", "Rohan Pawar", "Meera Reddy", "Arjun Gaikwad", "Sana Qureshi", "Vikram Chavan", "Tara D’Souza", "Nikhil Jadhav", "Pooja Naik", "Yash Thakkar", "Anika Shetty", "Imran Pathan", "Kavya Menon", "Sameer Bhatt", "Ritu Salvi"];
const donors: Donor[] = donorNames.map((name, i) => {
  const r = rng(100 + i);
  const group = BLOOD_GROUPS[Math.floor(r() * r() * 8 + (i % 3 === 0 ? 2 : 0)) % 8];
  const last = r() < 0.75 ? Math.floor(20 + r() * 300) : null;
  const next = last === null ? null : new Date(NOW + (90 - last) * D).toISOString();
  const sent = Math.floor(r() * 8);
  return { id: `D-${3100 + i}`, name, group, district: ["Mumbai City", "Mumbai Suburban", "Thane", "Pune"][i % 4], available: r() < 0.62, subscribed: r() < 0.8, verified: r() < 0.85, lastDonation: last === null ? null : new Date(NOW - last * D).toISOString(), nextEligible: next, contactMasked: `+91 ••••• ${String(10000 + Math.floor(r() * 89999)).slice(1)}`, alertsSent: sent, alertsAnswered: Math.floor(sent * r()) };
});

/* ---------- Activity, actions, admin ---------- */
const activity: Activity[] = [
  { id: "a1", text: "Emergency ER-1048 raised for 4 × O- red cells", institution: inst("h-sahyadri").name, at: at(-0.3), tone: "critical" },
  { id: "a2", text: "Offered 2 × B+ platelets against ER-1047", institution: inst("bb-harbour").name, at: at(-0.6), tone: "info" },
  { id: "a3", text: "12 units added to stock", institution: inst("bb-pune").name, at: at(-1.1), tone: "ok" },
  { id: "a4", text: "ER-1044 fulfilled", institution: inst("h-city").name, at: at(-3.4), tone: "ok" },
  { id: "a5", text: "3 units discarded after failed screening", institution: inst("bb-thane").name, at: at(-5), tone: "warn" },
  { id: "a6", text: "Registration submitted for verification", institution: inst("bb-eastern").name, at: at(-52), tone: "info" },
];
const pending: PendingAction[] = [
  { id: "p1", action: "Respond to ER-1048 (O- red cells)", owner: "Blood banks in range", due: at(1.5), href: "/emergencies/ER-1048" },
  { id: "p2", action: "Approve registration for Eastern Link Blood Bank", owner: "State admin", due: at(24), href: "/institutions/bb-eastern" },
  { id: "p3", action: "Review 6 units expiring within 48 hours", owner: "Harbour City Blood Bank", due: at(48), href: "/inventory" },
  { id: "p4", action: "Verify 3 new donor records", owner: "State admin", due: at(72), href: "/donors" },
];
const users: AppUser[] = [
  { id: "u1", name: "Anita Rao", email: "anita.rao@example.org", role: "State admin", institution: "State blood programme", status: "Active", lastSignIn: at(-0.5) },
  { id: "u2", name: "R. Kulkarni", email: "r.kulkarni@example.org", role: "Blood bank", institution: inst("bb-harbour").name, status: "Active", lastSignIn: at(-2) },
  { id: "u3", name: "Dr. L. Bhosale", email: "l.bhosale@example.org", role: "Hospital", institution: inst("h-sahyadri").name, status: "Active", lastSignIn: at(-0.4) },
  { id: "u4", name: "Dr. G. More", email: "g.more@example.org", role: "Hospital", institution: inst("h-rural").name, status: "Disabled", lastSignIn: at(-300) },
  { id: "u5", name: "V. Patil", email: "v.patil@example.org", role: "Blood bank", institution: inst("bb-eastern").name, status: "Active", lastSignIn: null },
];
const audit: AuditEntry[] = [
  { id: "e1", user: "Dr. L. Bhosale", action: "Created emergency request", record: "ER-1048", at: at(-0.3), result: "Success" },
  { id: "e2", user: "R. Kulkarni", action: "Reserved 2 units", record: "ER-1046", at: at(-2.1), result: "Success" },
  { id: "e3", user: "Anita Rao", action: "Suspended institution", record: "MH-H-1209", at: at(-240), result: "Success" },
  { id: "e4", user: "V. Patil", action: "Viewed donor contact details", record: "D-3104", at: at(-30), result: "Denied" },
  { id: "e5", user: "M. Shaikh", action: "Issued 1 unit", record: "U-24057", at: at(-6), result: "Success" },
];

/* ---------- Accessors (swap these for real calls) ---------- */
const delay = <T,>(v: T) => Promise.resolve(v);

export async function getNow() { return delay(NOW); }

export async function getOverview() {
  const live = units.filter(u => u.status === "Available");
  const open = emergencies.filter(isOpen);
  const criticalGroups = groupRows(units).filter(g => g.level !== "ok");
  return delay({
    now: NOW,
    cards: { available: live.length, activeEmergencies: open.length, criticalEmergencies: open.filter(e => e.urgency === "Critical").length, institutions: institutions.filter(i => i.status === "Active").length, hospitals: hospitals.filter(i => i.status === "Active").length, banks: banks.filter(i => i.status === "Active").length, pending: pending.length },
    recentEmergencies: emergencies.slice(0, 5),
    alerts: criticalGroups.map(g => ({ ...g })),
    groups: groupRows(units),
    activity,
    pending,
    requestsByDay: requestsByDay(),
  });
}

export async function getInventory() { return delay({ now: NOW, units, groups: groupRows(units), totals: { available: units.filter(u => u.status === "Available").length, reserved: units.filter(u => u.status === "Reserved").length, expiringSoon: units.filter(expiringSoon).length, lowGroups: groupRows(units).filter(g => g.level !== "ok").length }, institutions: banks.map(b => ({ id: b.id, name: b.name })) }); }
export async function getEmergencies() { const open = emergencies.filter(isOpen); return delay({ now: NOW, items: emergencies, cards: { active: open.length, critical: open.filter(e => e.urgency === "Critical").length, awaiting: emergencies.filter(e => e.status === "Awaiting response").length, inProgress: emergencies.filter(e => e.status === "Processing" || e.status === "Partially fulfilled").length, completedToday: emergencies.filter(e => e.status === "Fulfilled" && NOW - Date.parse(e.createdAt) < 24 * H).length }, hospitals: hospitals.filter(h => h.status === "Active").map(h => ({ id: h.id, name: h.name })) }); }
export async function getEmergency(id: string) { const e = emergencies.find(x => x.id === id); return delay(e ? { now: NOW, emergency: e } : null); }
export async function getInstitutions() { return delay({ now: NOW, items: institutions, cards: { hospitals: hospitals.length, banks: banks.length, active: institutions.filter(i => i.status === "Active").length, attention: institutions.filter(i => i.status !== "Active").length } }); }
export async function getInstitution(id: string) {
  const i = institutions.find(x => x.id === id);
  if (!i) return delay(null);
  const stock = i.type === "Blood bank" ? units.filter(u => u.institutionId === id) : [];
  return delay({ now: NOW, institution: i, groups: groupRows(stock), stock: { available: stock.filter(u => u.status === "Available").length, expiring: stock.filter(expiringSoon).length }, emergencies: emergencies.filter(e => e.hospitalId === id || e.responses.some(r => r.institutionId === id)), activity: activity.filter(a => a.institution === i.name) });
}
export async function getDonors() { return delay({ now: NOW, items: donors, cards: { registered: donors.length, available: donors.filter(d => d.available).length, subscribed: donors.filter(d => d.subscribed).length, pending: donors.filter(d => !d.verified).length } }); }
export async function getDonor(id: string) { const d = donors.find(x => x.id === id); return delay(d ? { now: NOW, donor: d } : null); }

function requestsByDay() {
  const r = rng(5);
  return Array.from({ length: 14 }, (_, i) => { const day = new Date(NOW - (13 - i) * D).toISOString(); return { day, Critical: Math.floor(r() * 3), High: Math.floor(1 + r() * 4), Normal: Math.floor(1 + r() * 5) }; });
}
export async function getReports() {
  const byStatus = emergencies.reduce<Record<string, number>>((m, e) => ((m[e.status] = (m[e.status] ?? 0) + 1), m), {});
  const expiryByDay = Array.from({ length: 7 }, (_, i) => ({ day: new Date(NOW + i * D).toISOString(), count: units.filter(u => u.status === "Available" && Math.floor((Date.parse(u.expiresOn) - NOW) / D) === i).length }));
  const closed = emergencies.filter(e => e.status === "Fulfilled" || e.status === "Rejected" || e.status === "Cancelled" || e.status === "Partially fulfilled");
  const fulfilled = emergencies.filter(e => e.status === "Fulfilled").length;
  return delay({
    now: NOW, groups: groupRows(units), requestsByDay: requestsByDay(), byStatus, expiryByDay,
    cards: { collected: 412, issued: 268, requests: emergencies.length, fulfilmentRate: closed.length ? Math.round((fulfilled / closed.length) * 100) : 0 },
    movement: units.filter(u => u.status === "Issued" || u.status === "Discarded" || u.status === "Expired").slice(0, 12),
    emergencies,
    institutions: institutions.map(i => ({ id: i.id, name: i.name })),
  });
}
export async function getAdmin() { return delay({ now: NOW, users, audit, pendingInstitutions: institutions.filter(i => i.status === "Pending"), cards: { users: users.length, active: institutions.filter(i => i.status === "Active").length, pending: institutions.filter(i => i.status === "Pending").length } }); }
