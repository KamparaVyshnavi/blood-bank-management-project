export type StatusTone = "healthy" | "low" | "critical" | "info" | "neutral";

export function StatusBadge({ tone = "neutral", children }: { tone?: StatusTone; children: React.ReactNode }) {
  return <span className={`status-badge status-${tone}`}><span aria-hidden="true" className="status-dot" />{children}</span>;
}
