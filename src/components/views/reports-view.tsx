"use client";

import { useMemo, useState } from "react";
import { PageHeader, Section } from "../ds/page-header";
import { StatGrid, SummaryCard } from "../ds/summary-card";
import { DataTable } from "../ds/data-table";
import { BloodTag, EmergencyStatusBadge, UnitStatusBadge } from "../ds/status";
import { HBars, VBars } from "../ds/charts";
import { FilterBar, SelectFilter } from "../ds/filter-bar";
import { useDemoData } from "@/components/providers/demo-data-provider";
import { groupRows } from "@/lib/inventory-math";
import { Icon } from "../ds/icons";
import { fmtDate, fmtDay } from "@/lib/format";
import { BLOOD_GROUPS, type BloodUnit, type Emergency, type GroupRow } from "@/lib/ops-types";

type Data = { now: number; groups: GroupRow[]; requestsByDay: { day: string; Critical: number; High: number; Normal: number }[]; byStatus: Record<string, number>; expiryByDay: { day: string; count: number }[]; cards: { collected: number; issued: number; requests: number; fulfilmentRate: number }; movement: BloodUnit[]; emergencies: Emergency[]; institutions: { id: string; name: string }[] };
const RANGES = ["Last 24 hours", "Last 7 days", "Last 30 days"] as const;
const HOURS: Record<string, number> = { "Last 24 hours": 24, "Last 7 days": 168, "Last 30 days": 720 };

function toCsv(rows: Emergency[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ["Request", "Hospital", "Blood group", "Component", "Units requested", "Units fulfilled", "Urgency", "Status", "Raised"];
  return [head, ...rows.map(e => [e.id, e.hospital, e.group, e.component, e.units, e.unitsFulfilled, e.urgency, e.status, e.createdAt])].map(r => r.map(esc).join(",")).join("\n");
}

export function ReportsView({ data }: { data: Data }) {
  const { data: sharedData } = useDemoData();
  const now = data.now;
  const units = sharedData.units;
  const emergencies = sharedData.emergencies;
  const institutions = sharedData.institutions;

  const [range, setRange] = useState<string>("Last 30 days");
  const [group, setGroup] = useState("ALL");
  const [inst, setInst] = useState("ALL");

  const groups = useMemo(() => groupRows(units, now), [units, now]);

  const byStatus = useMemo(
    () => emergencies.reduce<Record<string, number>>((m, e) => ((m[e.status] = (m[e.status] ?? 0) + 1), m), {}),
    [emergencies]
  );

  const expiryByDay = useMemo(
    () => Array.from({ length: 7 }, (_, i) => ({
      day: new Date(now + i * 86400000).toISOString(),
      count: units.filter(u => u.status === "Available" && Math.floor((Date.parse(u.expiresOn) - now) / 86400000) === i).length,
    })),
    [units, now]
  );

  const requestsByDay = useMemo(
    () => Array.from({ length: 14 }, (_, i) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (13 - i));
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const reqs = emergencies.filter(e => {
        const created = Date.parse(e.createdAt);
        return created >= date.getTime() && created < nextDate.getTime();
      });

      return {
        day: date.toISOString(),
        Critical: reqs.filter(e => e.urgency === "Critical").length,
        High: reqs.filter(e => e.urgency === "High").length,
        Normal: reqs.filter(e => e.urgency === "Normal").length,
      };
    }),
    [emergencies, now]
  );

  const closed = emergencies.filter(e => ["Fulfilled", "Rejected", "Cancelled", "Partially fulfilled"].includes(e.status));
  const fulfilled = emergencies.filter(e => e.status === "Fulfilled").length;

  const cards = {
    collected: 412 + Math.max(0, units.length - 230),
    issued: units.filter(u => u.status === "Issued").length,
    requests: emergencies.length,
    fulfilmentRate: closed.length ? Math.round((fulfilled / closed.length) * 100) : 0,
  };

  const movement = useMemo(
    () => units.filter(u => u.status === "Issued" || u.status === "Discarded" || u.status === "Expired").slice(0, 15),
    [units]
  );

  const rows = useMemo(
    () => emergencies.filter(e => now - Date.parse(e.createdAt) <= HOURS[range] * 3600000 && (group === "ALL" || e.group === group) && (inst === "ALL" || e.hospitalId === inst)),
    [emergencies, now, range, group, inst]
  );

  const hospitals = useMemo(
    () => institutions.filter(i => emergencies.some(e => e.hospitalId === i.id)),
    [institutions, emergencies]
  );

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "emergency-fulfilment.csv" }); a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="ds-page">
      <PageHeader title="Reports" description="What has been collected, requested and fulfilled over time." />
      <StatGrid>
        <SummaryCard label="Units collected" value={cards.collected} note="In the last 30 days" />
        <SummaryCard label="Units issued" value={cards.issued} note="In the last 30 days" />
        <SummaryCard label="Emergency requests" value={cards.requests} note="Received in the period" />
        <SummaryCard label="Fulfilment rate" value={`${cards.fulfilmentRate}%`} note="Fully fulfilled ÷ requests that have closed" />
      </StatGrid>

      <div className="ds-split ds-split-even">
        <Section title="Current stock by blood group"><HBars label="Available units by blood group" rows={groups.map(g => ({ label: g.group, segments: [{ key: "Available", value: g.available }, { key: "Reserved", value: g.reserved }] }))} /></Section>
        <Section title="Request status"><HBars label="Emergency requests by status" rows={Object.entries(byStatus).map(([k, v]) => ({ label: k, segments: [{ key: "count", value: v }] }))} /></Section>
      </div>
      <div className="ds-split ds-split-even">
        <Section title="Emergency requests over time" hint="Last 14 days, by urgency"><VBars label="Emergency requests per day by urgency" keys={["Critical", "High", "Normal"]} data={requestsByDay.map(d => ({ label: fmtDay(d.day), segments: [{ key: "Normal", value: d.Normal }, { key: "High", value: d.High }, { key: "Critical", value: d.Critical }] }))} /></Section>
        <Section title="Units expiring" hint="Available units by days until expiry"><VBars label="Available units expiring per day, next 7 days" keys={["count"]} data={expiryByDay.map(d => ({ label: fmtDay(d.day), segments: [{ key: "count", value: d.count }] }))} /></Section>
      </div>

      <Section title="Emergency fulfilment" flush action={<button className="ds-btn ds-btn-small" onClick={exportCsv} disabled={rows.length === 0}><Icon name="download" size={15} />Export CSV</button>}>
        <div className="ds-card-pad">
          <FilterBar count={rows.length} total={data.emergencies.length} noun="requests">
            <SelectFilter label="Date range" all="All time" options={RANGES} value={range} onChange={setRange} />
            <SelectFilter label="Blood group" all="All groups" options={BLOOD_GROUPS} value={group} onChange={setGroup} />
            <label className="ds-select"><span>Hospital</span><select value={inst} onChange={e => setInst(e.target.value)}><option value="ALL">All hospitals</option>{hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
          </FilterBar>
        </div>
        <DataTable caption="Emergency fulfilment report" rows={rows} rowKey={e => e.id} rowHref={e => `/emergencies/${e.id}`} empty="No requests in this period."
          columns={[
            { key: "id", header: "Request", render: e => <span className="ds-id">{e.id}</span> }, { key: "h", header: "Hospital", render: e => e.hospital }, { key: "g", header: "Group", render: e => <BloodTag group={e.group} /> },
            { key: "u", header: "Fulfilled", align: "right", render: e => `${e.unitsFulfilled} / ${e.units}` }, { key: "s", header: "Status", render: e => <EmergencyStatusBadge status={e.status} /> }]} />
      </Section>

      <Section title="Units issued, discarded or expired" hint="Most recent inventory movement" flush>
        <DataTable caption="Inventory movement" rows={movement} rowKey={u => u.id}
          columns={[{ key: "id", header: "Unit", render: u => <span className="ds-id">{u.id}</span> }, { key: "g", header: "Group", render: u => <BloodTag group={u.group} /> }, { key: "c", header: "Component", render: u => u.component }, { key: "s", header: "Outcome", render: u => <UnitStatusBadge status={u.status} /> }, { key: "b", header: "Blood bank", render: u => u.institution }, { key: "e", header: "Expiry date", render: u => fmtDate(u.expiresOn) }]} />
      </Section>
    </div>
  );
}
