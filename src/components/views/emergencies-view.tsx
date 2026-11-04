"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, Section } from "../ds/page-header";
import { StatGrid, SummaryCard } from "../ds/summary-card";
import { DataTable } from "../ds/data-table";
import { BloodTag, EmergencyStatusBadge, UrgencyBadge } from "../ds/status";
import { FilterBar, SearchBox, SelectFilter } from "../ds/filter-bar";
import { Dialog } from "../ds/confirm-dialog";
import { Icon } from "../ds/icons";
import { fmtDateTime, relative } from "@/lib/format";
import { BLOOD_GROUPS, COMPONENTS, EMERGENCY_STATUSES, URGENCIES, type Emergency, type Urgency } from "@/lib/ops-types";

type Cards = { active: number; critical: number; awaiting: number; inProgress: number; completedToday: number };
const URGENCY_RANK: Record<Urgency, number> = { Critical: 0, High: 1, Normal: 2 };
const OPEN = ["Submitted", "Processing", "Awaiting response", "Partially allocated", "Allocated"];

export function EmergenciesView({ items: initial, cards, canCreate, now }: { items: Emergency[]; cards: Cards; canCreate: boolean; now: number }) {
  const params = useSearchParams();
  const router = useRouter();
  const items = initial;
  const [q, setQ] = useState(""); const [status, setStatus] = useState("ALL"); const [urgency, setUrgency] = useState("ALL"); const [group, setGroup] = useState("ALL");
  const [creating, setCreating] = useState(params.get("new") === "1" && canCreate);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const rows = useMemo(() => items.filter(e => {
    if (q && !`${e.id} ${e.hospital}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (status !== "ALL" && e.status !== status) return false;
    if (urgency !== "ALL" && e.urgency !== urgency) return false;
    if (group !== "ALL" && e.group !== group) return false;
    return true;
  }).sort((a, b) => Number(OPEN.includes(b.status)) - Number(OPEN.includes(a.status)) || URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || Date.parse(a.deadline) - Date.parse(b.deadline)), [items, q, status, urgency, group]);

  async function create(form: FormData) {
    const hours = Number(form.get("hours"));
    const key = idempotencyKey ?? crypto.randomUUID();
    setIdempotencyKey(key);
    const componentLabel = form.get("component");
    const component = componentLabel === "Red cells" ? "PRBC" : componentLabel === "Plasma" ? "FFP" : componentLabel === "Platelets" ? "PLATELETS" : null;
    const urgencyLabel = form.get("urgency");
    const urgency = urgencyLabel === "Critical" ? "CRITICAL" : urgencyLabel === "High" ? "URGENT" : null;
    if (!component || !urgency || !Number.isFinite(hours) || hours < 1 || hours > 24) {
      setToast("Check the component, urgency and deadline. Emergency intake supports urgent or critical requests within 24 hours.");
      return;
    }
    try {
      const response = await fetch("/api/emergencies", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, group: form.get("group"), component, quantity: Number(form.get("units")), urgency, expectedTransfusionAt: new Date(now + hours * 3600000).toISOString() }) });
      const result = await response.json() as { accepted?: boolean; status?: string; requestId?: string; error?: string; retrySamePayload?: boolean };
      if (response.status === 202 && result.accepted) {
        setToast(`Request ${result.requestId ?? ""} accepted for durable processing.`);
        setCreating(false); setIdempotencyKey(null); router.refresh();
        return;
      }
      setToast(result.retrySamePayload ? "Acknowledgement is uncertain. Retry the same request without changing its details." : `Request was not accepted: ${result.error ?? result.status ?? "Unexpected response"}.`);
    } catch {
      setToast("Connection interrupted. Retry the same request without changing its details.");
    }
  }

  return (
    <div className="ds-page">
      <PageHeader title="Emergencies" description="Urgent blood requests from hospitals and the responses from blood banks.">
        {canCreate && <button className="ds-btn ds-btn-primary" onClick={() => { setIdempotencyKey(crypto.randomUUID()); setCreating(true); }}><Icon name="plus" size={16} />New emergency request</button>}
      </PageHeader>
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
        <form className="ds-form" onSubmit={e => { e.preventDefault(); void create(new FormData(e.currentTarget)); }}>
          <div className="ds-form-row">
            <label>Blood group<select name="group" required>{BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}</select></label>
            <label>Component<select name="component" required>{COMPONENTS.map(c => <option key={c}>{c}</option>)}</select></label>
          </div>
          <div className="ds-form-row">
            <label>Units required<input name="units" type="number" min={1} max={20} defaultValue={2} required /></label>
            <label>Urgency<select name="urgency" defaultValue="High"><option>High</option><option>Critical</option></select></label>
          </div>
          <label>Needed within (hours)<input name="hours" type="number" min={1} max={24} defaultValue={4} required /></label>
          <div className="ds-dialog-foot"><button type="button" className="ds-btn ds-btn-quiet" onClick={() => { setCreating(false); setIdempotencyKey(null); }}>Cancel</button><button type="submit" className="ds-btn ds-btn-primary">Submit request</button></div>
        </form>
      </Dialog>
    </div>
  );
}
