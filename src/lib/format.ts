const TZ = "Asia/Kolkata";
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: TZ, day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" });
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: TZ, day: "numeric", month: "short" });

/** "in 2h 10m" / "1h 5m overdue" / "3 days ago". `now` is passed in so server and client agree. */
export function relative(iso: string, now: number): string {
  const diff = Date.parse(iso) - now;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const h = Math.floor(mins / 60), m = mins % 60, d = Math.floor(h / 24);
  const span = d >= 2 ? `${d} days` : h >= 1 ? (m ? `${h}h ${m}m` : `${h}h`) : `${Math.max(mins, 1)}m`;
  return diff >= 0 ? `in ${span}` : `${span} ago`;
}
export function daysLeft(iso: string, now: number): number { return Math.ceil((Date.parse(iso) - now) / 86400000); }
