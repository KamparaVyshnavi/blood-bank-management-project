"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Section } from "../ds/page-header";
import { StatGrid, SummaryCard } from "../ds/summary-card";
import { DataTable } from "../ds/data-table";
import { BloodTag, EmergencyStatusBadge, UrgencyBadge } from "../ds/status";
import { FilterBar, SearchBox, SelectFilter } from "../ds/filter-bar";
import { Dialog } from "../ds/confirm-dialog";
import { PlaceholderNote } from "../ds/placeholder-note";
import { Icon } from "../ds/icons";
import { fmtDateTime, relative } from "@/lib/format";
import { useDemoData } from "@/components/providers/demo-data-provider";
import { BLOOD_GROUPS, COMPONENTS, EMERGENCY_STATUSES, URGENCIES, type BloodComponent, type BloodGroup, type Emergency, type Urgency } from "@/lib/ops-types";

type Cards = { active: number; critical: number; awaiting: number; inProgress: number; completedToday: number };
const URGENCY_RANK: Record<Urgency, number> = { Critical: 0, High: 1, Normal: 2 };
const OPEN = ["Submitted", "Processing", "Awaiting response", "Partially fulfilled"];

export function EmergenciesView({ now }: { items?: Emergency[]; cards?: Cards; hospitals?: { id: string; name: string }[]; now: number }) {
  const params = useSearchParams();
  const { data, setData } = useDemoData();

  const items = data.emergencies;
  const hospitals = data.institutions.filter(
    (institution) => institution.type === "Hospital" && institution.status === "Active"
  );

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [urgency, setUrgency] = useState("ALL");
  const [group, setGroup] = useState("ALL");
  const [creating, setCreating] = useState(params.get("new") === "1");
  const [toast, setToast] = useState("");

  const openRequests = items.filter(e => OPEN.includes(e.status));
  const cards: Cards = {
    active: openRequests.length,
    critical: openRequests.filter(e => e.urgency === "Critical").length,
    awaiting: items.filter(e => e.status === "Awaiting response").length,
    inProgress: items.filter(e => e.status === "Processing" || e.status === "Partially fulfilled").length,
    completedToday: items.filter(e => e.status === "Fulfilled" && now - Date.parse(e.createdAt) < 24 * 3600000).length,
  };

  const rows = useMemo(() => items.filter(e => {
    if (q && !`${e.id} ${e.hospital}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (status !== "ALL" && e.status !== status) return false;
    if (urgency !== "ALL" && e.urgency !== urgency) return false;
    if (group !== "ALL" && e.group !== group) return false;
    return true;
  }).sort((a, b) => Number(OPEN.includes(b.status)) - Number(OPEN.includes(a.status)) || URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || Date.parse(a.deadline) - Date.parse(b.deadline)), [items, q, status, urgency, group]);

  function create(form: FormData) {
    const hospitalId = String(form.get("hospital"));
    const h = hospitals.find(x => x.id === hospitalId) ?? data.institutions.find(x => x.id === hospitalId);
    const hours = Number(form.get("hours"));
    const maxId = items.reduce((max, e) => {
      const n = parseInt(e.id.replace(/\D/g, ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 1048);
    const id = `ER-${maxId + 1}`;
    const created = new Date(now).toISOString();
    const groupVal = form.get("group") as BloodGroup;
    const componentVal = form.get("component") as BloodComponent;
    const unitsVal = Number(form.get("units"));
    const urgencyVal = form.get("urgency") as Urgency;

    const e: Emergency = {
      id,
      hospitalId: h?.id ?? hospitalId,
      hospital: h?.name ?? "Hospital",
      district: h?.district ?? "",
      group: groupVal,
      component: componentVal,
      units: unitsVal,
      unitsFulfilled: 0,
      urgency: urgencyVal,
      status: "Submitted",
      createdAt: created,
      deadline: new Date(now + hours * 3600000).toISOString(),
      responses: [],
      timeline: [
        {
          label: "Request created",
          detail: `${h?.name ?? "Hospital"} requested ${unitsVal} × ${groupVal} ${componentVal.toLowerCase()}`,
          at: created,
        },
      ],
    };

    setData(prev => ({
      ...prev,
      emergencies: [e, ...prev.emergencies],
      activity: [
        {
          id: `a-${Date.now()}`,
          text: `Emergency ${id} raised for ${unitsVal} × ${groupVal} ${componentVal.toLowerCase()}`,
          institution: h?.name ?? "Hospital",
          at: created,
          tone: "critical",
        },
        ...prev.activity,
      ],
      audit: [
        {
          id: `e-${Date.now()}`,
          user: "Dr. L. Bhosale",
          action: "Created emergency request",
          record: id,
          at: created,
          result: "Success",
        },
        ...prev.audit,
      ],
    }));

    setCreating(false);
    setToast(`${id} submitted.`);
  }

  return (
    <div className="ds-page">
      <PageHeader title="Emergencies" description="Urgent blood requests from hospitals and the responses from blood banks.">
        <button className="ds-btn ds-btn-primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} />New emergency request</button>
      </PageHeader>
      <PlaceholderNote />
      {toast && <p className="ds-toast" role="status">{toast}</p>}

      <StatGrid>
        <SummaryCard label="Active requests" value={cards.active} note="Submitted, processing, awaiting or partly fulfilled" />
        <SummaryCard label="Critical" value={cards.critical} note="Active and marked critical" tone={cards.critical ? "critical" : "ok"} />
        <SummaryCard label="Awaiting response" value={cards.awaiting} note="No blood bank has confirmed yet" tone={cards.awaiting ? "warn" : "ok"} />
        <SummaryCard label="In progress" value={cards.inProgress} note="Being processed or partly fulfilled" />
        <SummaryCard label="Fulfilled today" value={cards.completedToday} note="Completed in the last 24 hours" tone="ok" />
      </StatGrid>

      <Section title="Requests" hint="Open requests first, most urgent at the top." flush>
        <div className="ds-card-pad">
          <FilterBar count={rows.length} total={items.length} noun="requests">
            <SearchBox label="Search requests" placeholder="Request ID or hospital" value={q} onChange={setQ} />
            <SelectFilter label="Status" all="All statuses" options={EMERGENCY_STATUSES} value={status} onChange={setStatus} />
            <SelectFilter label="Urgency" all="Any urgency" options={URGENCIES} value={urgency} onChange={setUrgency} />
            <SelectFilter label="Blood group" all="All groups" options={BLOOD_GROUPS} value={group} onChange={setGroup} />
          </FilterBar>
        </div>
        <DataTable caption="Emergency requests" rows={rows} rowKey={e => e.id} rowHref={e => `/emergencies/${e.id}`} empty="No requests match these filters."
          columns={[
            { key: "id", header: "Request", render: e => <span className="ds-id">{e.id}</span> },
            { key: "hospital", header: "Hospital", render: e => e.hospital },
            { key: "group", header: "Group", render: e => <BloodTag group={e.group} /> },
            { key: "component", header: "Component", render: e => e.component },
            { key: "units", header: "Units", align: "right", render: e => `${e.unitsFulfilled} / ${e.units}` },
            { key: "urgency", header: "Urgency", render: e => <UrgencyBadge urgency={e.urgency} /> },
            { key: "deadline", header: "Needed by", render: e => <>{fmtDateTime(e.deadline)} <span className="ds-muted">{OPEN.includes(e.status) ? relative(e.deadline, now) : ""}</span></> },
            { key: "status", header: "Status", render: e => <EmergencyStatusBadge status={e.status} /> },
          ]} />
      </Section>

      <Dialog open={creating} title="New emergency request" onClose={() => setCreating(false)}>
        <form className="ds-form" onSubmit={e => { e.preventDefault(); create(new FormData(e.currentTarget)); }}>
          <label>Hospital<select name="hospital" required>{hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
          <div className="ds-form-row">
            <label>Blood group<select name="group" required>{BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}</select></label>
            <label>Component<select name="component" required>{COMPONENTS.map(c => <option key={c}>{c}</option>)}</select></label>
          </div>
          <div className="ds-form-row">
            <label>Units required<input name="units" type="number" min={1} max={20} defaultValue={2} required /></label>
            <label>Urgency<select name="urgency" defaultValue="High">{URGENCIES.map(u => <option key={u}>{u}</option>)}</select></label>
          </div>
          <label>Needed within (hours)<input name="hours" type="number" min={1} max={72} defaultValue={4} required /></label>
          <div className="ds-dialog-foot"><button type="button" className="ds-btn ds-btn-quiet" onClick={() => setCreating(false)}>Cancel</button><button type="submit" className="ds-btn ds-btn-primary">Submit request</button></div>
        </form>
      </Dialog>
    </div>
  );
}
