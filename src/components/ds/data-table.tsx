import Link from "next/link";

export type Column<T> = { key: string; header: string; render: (row: T) => React.ReactNode; align?: "right"; width?: string };

export function DataTable<T>({ columns, rows, rowKey, rowHref, empty, caption }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; rowHref?: (row: T) => string; empty?: React.ReactNode; caption: string }) {
  if (rows.length === 0) return <div className="ds-empty">{empty ?? "Nothing to show."}</div>;
  return (
    <div className="ds-table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="ds-table">
        <caption className="ds-sr">{caption}</caption>
        <thead><tr>{columns.map(c => <th key={c.key} scope="col" className={c.align === "right" ? "ds-num" : undefined} style={c.width ? { width: c.width } : undefined}>{c.header}</th>)}</tr></thead>
        <tbody>
          {rows.map(row => (
            <tr key={rowKey(row)}>
              {columns.map((c, i) => <td key={c.key} className={c.align === "right" ? "ds-num" : undefined}>{i === 0 && rowHref ? <Link href={rowHref(row)} className="ds-row-link">{c.render(row)}</Link> : c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
