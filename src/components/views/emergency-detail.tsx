"use client";

import { PageHeader, Section } from "../ds/page-header";
import { DataTable } from "../ds/data-table";
import { BloodTag, EmergencyStatusBadge, UrgencyBadge } from "../ds/status";
import { ActivityTimeline } from "../ds/timeline";
import { fmtDateTime, relative } from "@/lib/format";
import type { BankResponse, Emergency } from "@/lib/ops-types";


export function EmergencyDetail({ emergency, now }: { emergency: Emergency; now: number }) {
  const e = emergency;
  const open = ["Submitted", "Processing", "Awaiting response", "Partially allocated", "Allocated"].includes(e.status);

  return (
    <div className="ds-page">
      <PageHeader title={`Emergency ${e.id}`} description={`${e.hospital} · ${e.units} × ${e.group} ${e.component.toLowerCase()}`} back={{ href: "/emergencies", label: "All emergencies" }} />

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

      <Section title="Blood bank allocations" hint="Persisted unit allocations and their current lifecycle state" flush>
        <DataTable caption="Blood bank allocations" rows={e.responses} rowKey={(r: BankResponse) => r.institutionId} empty="No allocation records are persisted for this request."
          columns={[
            { key: "bank", header: "Blood bank", render: r => r.bank },
            { key: "state", header: "Response", render: r => r.state },
            { key: "units", header: "Units offered", align: "right", render: r => r.unitsOffered },
            { key: "at", header: "Updated", render: r => fmtDateTime(r.at) },
          ]} />
      </Section>

    </div>
  );
}
