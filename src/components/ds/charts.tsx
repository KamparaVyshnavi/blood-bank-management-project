/** Dependency-free charts. Pure markup, so they render on the server and print cleanly. */

export type Segment = { key: string; value: number };
const SEG_CLASS: Record<string, string> = { Available: "seg-a", Reserved: "seg-b", Critical: "seg-crit", High: "seg-warn", Normal: "seg-calm", count: "seg-a" };

export function HBars({ rows, label, max }: { rows: { label: string; segments: Segment[]; total?: number }[]; label: string; max?: number }) {
  const top = max ?? Math.max(1, ...rows.map(r => r.total ?? r.segments.reduce((s, x) => s + x.value, 0)));
  const keys = [...new Set(rows.flatMap(r => r.segments.map(s => s.key)))];
  return (
    <figure className="ds-chart" aria-label={label}>
      <ul className="ds-hbars">
        {rows.map(r => {
          const total = r.total ?? r.segments.reduce((s, x) => s + x.value, 0);
          return (
            <li key={r.label}>
              <span className="ds-hbar-label">{r.label}</span>
              <span className="ds-hbar-track">{r.segments.map(s => s.value > 0 && <span key={s.key} className={`ds-seg ${SEG_CLASS[s.key] ?? "seg-a"}`} style={{ width: `${(s.value / top) * 100}%` }} title={`${s.key}: ${s.value}`} />)}</span>
              <span className="ds-hbar-value">{total}</span>
            </li>
          );
        })}
      </ul>
      {keys.length > 1 && <Legend keys={keys} />}
    </figure>
  );
}

export function VBars({ data, label, keys }: { data: { label: string; segments: Segment[] }[]; label: string; keys: string[] }) {
  const W = 560, H = 190, pad = { l: 28, b: 24, t: 8 };
  const totals = data.map(d => d.segments.reduce((s, x) => s + x.value, 0));
  const top = Math.max(1, ...totals);
  const step = (W - pad.l) / data.length, bw = Math.min(26, step * 0.62);
  const ticks = [0, Math.ceil(top / 2), top];
  return (
    <figure className="ds-chart" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="ds-vbars">
        {ticks.map(t => { const y = H - pad.b - (t / top) * (H - pad.b - pad.t); return <g key={t}><line x1={pad.l} x2={W} y1={y} y2={y} className="ds-grid" /><text x={pad.l - 6} y={y + 4} textAnchor="end" className="ds-axis">{t}</text></g>; })}
        {data.map((d, i) => {
          let y = H - pad.b; const x = pad.l + i * step + (step - bw) / 2;
          return (
            <g key={d.label}>
              {d.segments.map(s => { const h = (s.value / top) * (H - pad.b - pad.t); y -= h; return h > 0 ? <rect key={s.key} x={x} y={y} width={bw} height={h} rx={2} className={SEG_CLASS[s.key] ?? "seg-a"}><title>{`${d.label} · ${s.key}: ${s.value}`}</title></rect> : null; })}
              {(data.length <= 8 || i % 2 === 0) && <text x={x + bw / 2} y={H - 6} textAnchor="middle" className="ds-axis">{d.label}</text>}
            </g>
          );
        })}
      </svg>
      {keys.length > 1 && <Legend keys={keys} />}
    </figure>
  );
}

function Legend({ keys }: { keys: string[] }) { return <figcaption className="ds-legend">{keys.map(k => <span key={k}><i className={`ds-swatch ${SEG_CLASS[k] ?? "seg-a"}`} />{k}</span>)}</figcaption>; }
