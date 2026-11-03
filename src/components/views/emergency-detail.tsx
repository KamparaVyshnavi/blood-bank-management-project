"use client";

import { useState } from "react";
import { PageHeader, Section } from "../ds/page-header";
import { DataTable } from "../ds/data-table";
import { BloodTag, EmergencyStatusBadge, UrgencyBadge } from "../ds/status";
import { StatusBadge } from "../ui/status-badge";
import { ConfirmDialog } from "../ds/confirm-dialog";
import { ActivityTimeline } from "../ds/timeline";
import { PlaceholderNote } from "../ds/placeholder-note";
import { fmtDateTime, relative } from "@/lib/format";
import type { BankResponse, Emergency } from "@/lib/ops-types";

const OPEN = ["Submitted", "Processing", "Awaiting response", "Partially fulfilled"];
const respTone = { Contacted: "neutral", Offered: "info", Reserved: "info", Dispatched: "healthy", Declined: "critical" } as const;
type Action = "escalate" | "cancel" | "accept" | null;

export function EmergencyDetail({ emergency, now }: { emergency: Emergency; now: number }) {
  const [e, setE] = useState(emergency);
  const [action, setAction] = useState<Action>(null);
  const open = OPEN.includes(e.status);
  const offer = e.responses.find(r => r.state === "Offered");
  const stamp = new Date(now).toISOString();

  function run() {
    if (action === "cancel") setE(x => ({ ...x, status: "Cancelled", timeline: [...x.timeline, { label: "Request cancelled", detail: "Cancelled from this screen", at: stamp }] }));
    if (action === "escalate") setE(x => ({ ...x, urgency: "Critical", timeline: [...x.timeline, { label: "Request escalated", detail: "Urgency raised to critical", at: stamp }] }));
    if (action === "accept" && offer) setE(x => ({ ...x, status: "Partially fulfilled", unitsFulfilled: Math.min(x.units, x.unitsFulfilled + offer.unitsOffered), responses: x.responses.map(r => (r === offer ? { ...r, state: "Reserved" as const } : r)), timeline: [...x.timeline, { label: "Allocation accepted", detail: `${offer.unitsOffered} unit(s) from ${offer.bank}`, at: stamp }] }));
  }
  const copy = { cancel: ["Cancel this request?", "Blood banks will be told the request is no longer needed and any held units will be released.", "Cancel request", true], escalate: ["Escalate to critical?", "Blood banks in range will be alerted again with critical priority.", "Escalate request", false], accept: ["Accept this allocation?", `${offer?.unitsOffered ?? 0} unit(s) from ${offer?.bank ?? ""} will be reserved for this request.`, "Accept allocation", false] } as const;
  const c = action ? copy[action] : null;

  return (
    <div className="ds-page">
      <PageHeader title={`Emergency ${e.id}`} description={`${e.hospital} · ${e.units} × ${e.group} ${e.component.toLowerCase()}`} back={{ href: "/emergencies", label: "All emergencies" }}>
        {open && <>
          {offer && <button className="ds-btn ds-btn-primary" onClick={() => setAction("accept")}>Accept offer</button>}
          {e.urgency !== "Critical" && <button className="ds-btn" onClick={() => setAction("escalate")}>Escalate</button>}
          <button className="ds-btn ds-btn-danger-quiet" onClick={() => setAction("cancel")}>Cancel request</button>
        </>}
      </PageHeader>
      <PlaceholderNote />

      <div className="ds-split ds-split-even">
        <Section title="Request details">
          <dl className="ds-dl">
            <dt>Status</dt><dd><EmergencyStatusBadge status={e.status} /></dd>
            <dt>Urgency</dt><dd><UrgencyBadge urgency={e.urgency} /></dd>
            <dt>Hospital</dt><dd>{e.hospital}{e.district ? `, ${e.district}` : ""}</dd>
            <dt>Blood needed</dt><dd><BloodTag group={e.group} /> {e.component}</dd>
            <dt>Units</dt><dd>{e.unitsFulfilled} of {e.units} fulfilled</dd>
            <dt>Needed by</dt><dd>{fmtDateTime(e.deadline)}{open && <span className="ds-muted"> ({relative(e.deadline, now)})</span>}</dd>
            <dt>Raised</dt><dd>{fmtDateTime(e.createdAt)}</dd>
          </dl>
        </Section>
        <Section title="Activity" hint="Events recorded for this request">
          <ActivityTimeline events={e.timeline} />
        </Section>
      </div>

      <Section title="Blood bank responses" hint="Banks contacted and what each has offered" flush>
        <DataTable caption="Blood bank responses" rows={e.responses} rowKey={(r: BankResponse) => r.institutionId} empty="No blood banks have been contacted yet."
          columns={[
            { key: "bank", header: "Blood bank", render: r => r.bank },
            { key: "state", header: "Response", render: r => <StatusBadge tone={respTone[r.state]}>{r.state}</StatusBadge> },
            { key: "units", header: "Units offered", align: "right", render: r => r.unitsOffered },
            { key: "at", header: "Updated", render: r => fmtDateTime(r.at) },
          ]} />
      </Section>

      <ConfirmDialog open={!!action} title={c?.[0] ?? ""} message={c?.[1] ?? ""} confirmLabel={c?.[2] ?? "Confirm"} danger={!!c?.[3]} onConfirm={run} onClose={() => setAction(null)} />
    </div>
  );
}
