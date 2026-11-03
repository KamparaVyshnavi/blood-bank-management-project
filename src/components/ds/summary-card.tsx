import Link from "next/link";

type Tone = "default" | "critical" | "warn" | "ok";
export function SummaryCard({ label, value, note, tone = "default", href }: { label: string; value: string | number; note: string; tone?: Tone; href?: string }) {
  const body = <><span className="ds-stat-label">{label}</span><span className="ds-stat-value">{value}</span><span className="ds-stat-note">{note}</span></>;
  return href ? <Link href={href} className={`ds-stat ds-stat-${tone} ds-stat-link`}>{body}</Link> : <div className={`ds-stat ds-stat-${tone}`}>{body}</div>;
}
export function StatGrid({ children }: { children: React.ReactNode }) { return <div className="ds-stat-grid">{children}</div>; }
