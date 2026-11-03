"use client";
import { Icon } from "./icons";

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return <label className="ds-search"><span className="ds-sr">{label}</span><Icon name="search" size={16} /><input type="search" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} /></label>;
}
export function SelectFilter({ label, value, onChange, options, all }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[]; all: string }) {
  return <label className="ds-select"><span>{label}</span><select value={value} onChange={e => onChange(e.target.value)}><option value="ALL">{all}</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>;
}
export function FilterBar({ children, count, total, noun }: { children: React.ReactNode; count: number; total: number; noun: string }) {
  return <div className="ds-filterbar"><div className="ds-filters">{children}</div><p role="status" className="ds-count">{count === total ? `${total} ${noun}` : `${count} of ${total} ${noun}`}</p></div>;
}
