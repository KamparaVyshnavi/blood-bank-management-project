"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Section } from "../ds/page-header";
import { StatGrid, SummaryCard } from "../ds/summary-card";
import { DataTable, type Column } from "../ds/data-table";
import { BloodTag, LevelBadge, UnitStatusBadge } from "../ds/status";
import { FilterBar, SearchBox, SelectFilter } from "../ds/filter-bar";
import { ConfirmDialog, Dialog } from "../ds/confirm-dialog";
import { PlaceholderNote } from "../ds/placeholder-note";
import { Icon } from "../ds/icons";
import { fmtDate, relative } from "@/lib/format";
import { expiringSoon, groupRows, SOON_DAYS } from "@/lib/inventory-math";
import { BLOOD_GROUPS, COMPONENTS, UNIT_STATUSES, type BloodComponent, type BloodGroup, type BloodUnit } from "@/lib/ops-types";

const PAGE = 15;
const EXPIRY = ["Expiring within 3 days", "Already expired"] as const;
type Pending = { kind: "reserve" | "issue" | "release"; unit: BloodUnit } | null;

export function InventoryView({ units: initial, institutions, now }: { units: BloodUnit[]; institutions: { id: string; name: string }[]; now: number }) {
  const params = useSearchParams();
  const [units, setUnits] = useState(initial);
  const [q, setQ] = useState(""); const [group, setGroup] = useState("ALL"); const [comp, setComp] = useState("ALL"); const [status, setStatus] = useState("ALL"); const [expiry, setExpiry] = useState("ALL"); const [bank, setBank] = useState("ALL");
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<Pending>(null);
  const [detail, setDetail] = useState<BloodUnit | null>(null);
  const [adding, setAdding] = useState(params.get("add") === "1");
  const [toast, setToast] = useState("");

  const groups = useMemo(() => groupRows(units, now), [units, now]);
  const totals = useMemo(() => ({ available: units.filter(u => u.status === "Available").length, reserved: units.filter(u => u.status === "Reserved").length, soon: units.filter(u => expiringSoon(u, now)).length, low: groups.filter(g => g.level !== "ok").length }), [units, groups, now]);
  const rows = useMemo(() => units.filter(u => {
    if (q && !`${u.id} ${u.institution}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (group !== "ALL" && u.group !== group) return false;
    if (comp !== "ALL" && u.component !== comp) return false;
    if (status !== "ALL" && u.status !== status) return false;
    if (bank !== "ALL" && u.institutionId !== bank) return false;
    if (expiry === EXPIRY[0] && !expiringSoon(u, now)) return false;
    if (expiry === EXPIRY[1] && Date.parse(u.expiresOn) > now) return false;
    return true;
  }).sort((a, b) => Date.parse(a.expiresOn) - Date.parse(b.expiresOn)), [units, q, group, comp, status, bank, expiry, now]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); };

  function apply() {
    if (!pending) return;
    const next = pending.kind === "reserve" ? "Reserved" : pending.kind === "issue" ? "Issued" : "Available";
    setUnits(list => list.map(u => (u.id === pending.unit.id ? { ...u, status: next } : u)));
    setToast(`${pending.unit.id} is now ${next.toLowerCase()}.`);
  }
  function addUnit(form: FormData) {
    const bankId = String(form.get("bank")); const component = form.get("component") as BloodComponent; const collected = String(form.get("collected"));
    const shelf: Record<BloodComponent, number> = { "Whole blood": 35, "Red cells": 42, Plasma: 365, Platelets: 5 };
    const expires = new Date(Date.parse(collected) + shelf[component] * 86400000).toISOString();
    const id = `U-${24000 + units.length + 1}`;
    setUnits(list => [{ id, group: form.get("group") as BloodGroup, component, collectedOn: new Date(collected).toISOString(), expiresOn: expires, status: "Available", institutionId: bankId, institution: institutions.find(b => b.id === bankId)?.name ?? "" }, ...list]);
    setToast(`${id} added to stock.`); setAdding(false);
  }

  const columns: Column<BloodUnit>[] = [
    { key: "id", header: "Unit", render: u => <button className="ds-linkbtn ds-id" onClick={() => setDetail(u)}>{u.id}</button> },
    { key: "group", header: "Group", render: u => <BloodTag group={u.group} /> },
    { key: "component", header: "Component", render: u => u.component },
    { key: "expires", header: "Expires", render: u => <>{fmtDate(u.expiresOn)} <span className="ds-muted">{relative(u.expiresOn, now)}</span></> },
    { key: "status", header: "Status", render: u => <UnitStatusBadge status={u.status} /> },
    { key: "bank", header: "Blood bank", render: u => u.institution },
    { key: "actions", header: "Actions", render: u => (
      <span className="ds-row-actions">
        {u.status === "Available" && <button className="ds-btn ds-btn-small" onClick={() => setPending({ kind: "reserve", unit: u })}>Reserve</button>}
        {u.status === "Reserved" && <><button className="ds-btn ds-btn-small" onClick={() => setPending({ kind: "issue", unit: u })}>Issue</button><button className="ds-btn ds-btn-small ds-btn-quiet" onClick={() => setPending({ kind: "release", unit: u })}>Release</button></>}
      </span>) },
  ];

  const copy = pending && { reserve: { t: "Reserve this unit?", m: `${pending.unit.id} (${pending.unit.group} ${pending.unit.component.toLowerCase()}) will be held and unavailable to other requests.`, c: "Reserve unit" }, issue: { t: "Issue this unit?", m: `${pending.unit.id} will be marked as issued and removed from available stock. This can’t be undone here.`, c: "Issue unit" }, release: { t: "Release this reservation?", m: `${pending.unit.id} will return to available stock.`, c: "Release unit" } }[pending.kind];

  return (
    <div className="ds-page">
      <PageHeader title="Inventory" description="Blood stock by group, with every unit and its status.">
        <button className="ds-btn ds-btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} />Add blood unit</button>
      </PageHeader>
      <PlaceholderNote />
      {toast && <p className="ds-toast" role="status">{toast}</p>}

      <StatGrid>
        <SummaryCard label="Available units" value={totals.available} note="Ready to allocate" />
        <SummaryCard label="Expiring soon" value={totals.soon} note={`Available units expiring within ${SOON_DAYS} days`} tone={totals.soon ? "warn" : "ok"} />
        <SummaryCard label="Reserved units" value={totals.reserved} note="Held for a request, not yet issued" />
        <SummaryCard label="Groups needing stock" value={totals.low} note="Low or critical availability" tone={totals.low ? "critical" : "ok"} />
      </StatGrid>

      <Section title="By blood group" hint="Low stock: under 14 available. Critical: under 6." flush>
        <DataTable caption="Stock by blood group" rows={groups} rowKey={g => g.group}
          columns={[
            { key: "g", header: "Blood group", render: g => <BloodTag group={g.group} /> },
            { key: "a", header: "Available", align: "right", render: g => g.available },
            { key: "r", header: "Reserved", align: "right", render: g => g.reserved },
            { key: "e", header: "Expiring soon", align: "right", render: g => g.expiringSoon },
            { key: "s", header: "Status", render: g => <LevelBadge level={g.level} /> },
          ]} />
      </Section>

      <Section title="All units" flush>
        <div className="ds-card-pad">
          <FilterBar count={rows.length} total={units.length} noun="units">
            <SearchBox label="Search units" placeholder="Unit ID or blood bank" value={q} onChange={reset(setQ)} />
            <SelectFilter label="Blood group" all="All groups" options={BLOOD_GROUPS} value={group} onChange={reset(setGroup)} />
            <SelectFilter label="Component" all="All components" options={COMPONENTS} value={comp} onChange={reset(setComp)} />
            <SelectFilter label="Status" all="All statuses" options={UNIT_STATUSES} value={status} onChange={reset(setStatus)} />
            <SelectFilter label="Expiry" all="Any expiry" options={EXPIRY} value={expiry} onChange={reset(setExpiry)} />
            <label className="ds-select"><span>Blood bank</span><select value={bank} onChange={e => reset(setBank)(e.target.value)}><option value="ALL">All blood banks</option>{institutions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          </FilterBar>
        </div>
        <DataTable caption="Blood units" rows={view} rowKey={u => u.id} columns={columns} empty="No units match these filters. Clear a filter to see more." />
        {rows.length > PAGE && <nav className="ds-pager" aria-label="Pagination"><button className="ds-btn ds-btn-small" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page + 1} of {pages}</span><button className="ds-btn ds-btn-small" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>Next</button></nav>}
      </Section>

      <ConfirmDialog open={!!pending} title={copy?.t ?? ""} message={copy?.m ?? ""} confirmLabel={copy?.c ?? "Confirm"} onConfirm={apply} onClose={() => setPending(null)} />

      <Dialog open={!!detail} title={detail ? `Unit ${detail.id}` : ""} onClose={() => setDetail(null)} footer={<button type="button" className="ds-btn" onClick={() => setDetail(null)}>Close</button>}>
        {detail && <dl className="ds-dl"><dt>Blood group</dt><dd>{detail.group}</dd><dt>Component</dt><dd>{detail.component}</dd><dt>Collected</dt><dd>{fmtDate(detail.collectedOn)}</dd><dt>Expires</dt><dd>{fmtDate(detail.expiresOn)}</dd><dt>Status</dt><dd>{detail.status}</dd><dt>Blood bank</dt><dd>{detail.institution}</dd></dl>}
      </Dialog>

      <Dialog open={adding} title="Add blood unit" onClose={() => setAdding(false)}>
        <form className="ds-form" onSubmit={e => { e.preventDefault(); addUnit(new FormData(e.currentTarget)); }}>
          <label>Blood group<select name="group" required>{BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}</select></label>
          <label>Component<select name="component" required>{COMPONENTS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Collection date<input name="collected" type="date" required defaultValue={new Date(now).toISOString().slice(0, 10)} max={new Date(now).toISOString().slice(0, 10)} /></label>
          <label>Blood bank<select name="bank" required>{institutions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <div className="ds-dialog-foot"><button type="button" className="ds-btn ds-btn-quiet" onClick={() => setAdding(false)}>Cancel</button><button type="submit" className="ds-btn ds-btn-primary">Add unit</button></div>
        </form>
      </Dialog>
    </div>
  );
}
