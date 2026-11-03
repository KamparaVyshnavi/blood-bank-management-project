import { fmtDateTime } from "@/lib/format";
import type { TimelineEvent } from "@/lib/ops-types";

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return <div className="ds-empty">No events recorded yet.</div>;
  return <ol className="ds-timeline">{events.map((e, i) => <li key={i}><span className="ds-timeline-dot" aria-hidden="true" /><div><strong>{e.label}</strong>{e.detail && <p>{e.detail}</p>}<time dateTime={e.at}>{fmtDateTime(e.at)}</time></div></li>)}</ol>;
}
