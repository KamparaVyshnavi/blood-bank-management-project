"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader, Section } from "../ds/page-header";
import { DataTable } from "../ds/data-table";
import { BloodTag, EmergencyStatusBadge, InstitutionStatusBadge, LevelBadge, UrgencyBadge } from "../ds/status";
import { relative } from "@/lib/format";
import type { Activity, Emergency, GroupRow, Institution } from "@/lib/ops-types";

const TABS = ["Overview", "Inventory", "Emergencies", "Activity"] as const;
type Tab = (typeof TABS)[number];

export function InstitutionDetail({ institution: i, groups, stock, emergencies, activity, now, canViewInventory }: { institution: Institution; groups: GroupRow[]; stock: { available: number; expiring: number }; emergencies: Emergency[]; activity: Activity[]; now: number; canViewInventory: boolean }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const isBank = i.type === "Blood bank";
  const tabs = TABS.filter(t => t !== "Inventory" || (isBank && canViewInventory));

  return (
    <div className="ds-page">
      <PageHeader title={i.name} description={`${i.type} · ${i.district}`} back={{ href: "/institutions", label: "All institutions" }}>
      </PageHeader>
      <div className="ds-tabs" role="tablist" aria-label="Institution sections">
        {tabs.map(t => <button key={t} role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls="tabpanel" className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "Overview" && <Section title="Registration"><dl className="ds-dl">
          <dt>Status</dt><dd><InstitutionStatusBadge status={i.status} /></dd>
          <dt>Registration ID</dt><dd className="ds-id">{i.regId}</dd>
          <dt>Type</dt><dd>{i.type}</dd>
          <dt>Location</dt><dd>{i.district}</dd>
          <dt>Contact</dt><dd>Not recorded in the institution registry</dd>
          <dt>Administrators</dt><dd>Not recorded in the institution registry</dd>
          <dt>Last activity</dt><dd>{i.lastActivity ? relative(i.lastActivity, now) : "Not recorded"}</dd>
        </dl></Section>}
        {tab === "Inventory" && <Section title="Stock held" hint={`${stock.available} units available, ${stock.expiring} expiring within 3 days`} flush>
          <DataTable caption="Stock by blood group" rows={groups} rowKey={g => g.group} columns={[
            { key: "g", header: "Group", render: g => <BloodTag group={g.group} /> }, { key: "a", header: "Available", align: "right", render: g => g.available }, { key: "r", header: "Reserved", align: "right", render: g => g.reserved }, { key: "e", header: "Expiring soon", align: "right", render: g => g.expiringSoon }, { key: "s", header: "Status", render: g => <LevelBadge level={g.level} /> }]} />
        </Section>}
        {tab === "Emergencies" && <Section title={isBank ? "Requests this bank was asked to fill" : "Requests raised"} flush>
          <DataTable caption="Related emergencies" rows={emergencies} rowKey={e => e.id} rowHref={e => `/emergencies/${e.id}`} empty="No requests recorded for this institution." columns={[
            { key: "id", header: "Request", render: e => <span className="ds-id">{e.id}</span> }, { key: "n", header: "Needed", render: e => <><BloodTag group={e.group} /> × {e.units}</> }, { key: "u", header: "Urgency", render: e => <UrgencyBadge urgency={e.urgency} /> }, { key: "s", header: "Status", render: e => <EmergencyStatusBadge status={e.status} /> }]} />
        </Section>}
        {tab === "Activity" && <Section title="Recent activity" flush>
          {activity.length === 0 ? <div className="ds-empty">No recent activity recorded.</div> : <ul className="ds-feed">{activity.map(a => <li key={a.id}><span className={`ds-feed-dot tone-${a.tone}`} aria-hidden="true" /><div><p>{a.text}</p><span>{relative(a.at, now)}</span></div></li>)}</ul>}
        </Section>}
      </div>
      <p className="ds-muted"><Link className="ds-link" href="/institutions">Back to directory</Link></p>
    </div>
  );
}
