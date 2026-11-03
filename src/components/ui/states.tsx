import Link from "next/link";

export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="empty-state"><div className="empty-symbol" aria-hidden="true">＋</div><h2>{title}</h2><p>{children}</p><Link className="text-link" href="/">Back to Overview <span aria-hidden="true">↗</span></Link></div>;
}

export function LoadingState() {
  return <div className="ds-page" role="status" aria-label="Loading"><div className="skeleton" style={{ height: 34, width: 220 }} aria-hidden="true" /><div className="ds-stat-grid" aria-hidden="true">{[0, 1, 2, 3].map(i => <div key={i} className="ds-stat"><div className="skeleton short" /><div className="skeleton" style={{ height: 30, width: 70 }} /></div>)}</div><span className="ds-sr">Loading…</span></div>;
}
