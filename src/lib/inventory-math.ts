import { BLOOD_GROUPS, type BloodUnit, type GroupRow } from "./ops-types";

export const SOON_DAYS = 3;
const DAY = 86400000;
export const LOW_BELOW = 14;
export const CRITICAL_BELOW = 6;

/** A unit is "expiring soon" only if it is still available and expires within SOON_DAYS. */
export function expiringSoon(u: BloodUnit, now: number) {
  const left = Date.parse(u.expiresOn) - now;
  return u.status === "Available" && left > 0 && left <= SOON_DAYS * DAY;
}

/** Totals are always derived from unit records and their lifecycle status. */
export function groupRows(list: BloodUnit[], now: number): GroupRow[] {
  return BLOOD_GROUPS.map(group => {
    const g = list.filter(u => u.group === group);
    const available = g.filter(u => u.status === "Available").length;
    return { group, available, reserved: g.filter(u => u.status === "Reserved").length, expiringSoon: g.filter(u => expiringSoon(u, now)).length, level: available < CRITICAL_BELOW ? "critical" : available < LOW_BELOW ? "low" : "ok" };
  });
}
