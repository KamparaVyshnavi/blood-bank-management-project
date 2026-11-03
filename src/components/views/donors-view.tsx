"use client";

import { useMemo, useState } from "react";
import { PageHeader, Section } from "../ds/page-header";
import { StatGrid, SummaryCard } from "../ds/summary-card";
import { DataTable } from "../ds/data-table";
import { BloodTag } from "../ds/status";
import { StatusBadge } from "../ui/status-badge";
import { FilterBar, SearchBox, SelectFilter } from "../ds/filter-bar";
import { fmtDate } from "@/lib/format";
import { BLOOD_GROUPS, type Donor } from "@/lib/ops-types";

export function DonorsView({ items, cards }: { items: Donor[]; cards: { registered: number; available: number; subscribed: number; pending: number }; now: number }) {
  const [q, setQ] = useState(""); const [group, setGroup] = useState("ALL"); const [avail, setAvail] = useState("ALL"); const [ver, setVer] = useState("ALL");
  const rows = useMemo(() => items.filter(d => (!q || `${d.name} ${d.id}`.toLowerCase().includes(q.toLowerCase())) && (group === "ALL" || d.group === group) && (avail === "ALL" || (avail === "Available") === d.available) && (ver === "ALL" || (ver === "Verified") === d.verified)), [items, q, group, avail, ver]);
  return (
    <div className="ds-page">
      <PageHeader title="Donors" description="Donor records and who can be alerted. Contact details stay masked in lists." />
      <StatGrid>
        <SummaryCard label="Registered donors" value={cards.registered} note="Donor records on file" />
        <SummaryCard label="Marked available" value={cards.available} note="Availability is a preference, not a medical clearance" />
        <SummaryCard label="Subscribed to alerts" value={cards.subscribed} note="Can receive emergency notifications" />
        <SummaryCard label="Pending verification" value={cards.pending} note="Records awaiting review" tone={cards.pending ? "warn" : "ok"} />
      </StatGrid>
      <Section title="Donor records" flush>
        <div className="ds-card-pad">
          <FilterBar count={rows.length} total={items.length} noun="donors">
            <SearchBox label="Search donors" placeholder="Name or donor ID" value={q} onChange={setQ} />
            <SelectFilter label="Blood group" all="All groups" options={BLOOD_GROUPS} value={group} onChange={setGroup} />
            <SelectFilter label="Availability" all="Any" options={["Available", "Unavailable"]} value={avail} onChange={setAvail} />
            <SelectFilter label="Verification" all="Any" options={["Verified", "Unverified"]} value={ver} onChange={setVer} />
          </FilterBar>
        </div>
        <DataTable caption="Donor records" rows={rows} rowKey={d => d.id} rowHref={d => `/donors/${d.id}`} empty="No donors match these filters."
          columns={[
            { key: "name", header: "Donor", render: d => d.name },
            { key: "id", header: "ID", render: d => <span className="ds-id">{d.id}</span> },
            { key: "g", header: "Group", render: d => <BloodTag group={d.group} /> },
            { key: "loc", header: "District", render: d => d.district },
            { key: "avail", header: "Availability", render: d => <StatusBadge tone={d.available ? "healthy" : "neutral"}>{d.available ? "Available" : "Unavailable"}</StatusBadge> },
            { key: "sub", header: "Alerts", render: d => d.subscribed ? "Subscribed" : "Off" },
            { key: "last", header: "Last donation", render: d => (d.lastDonation ? fmtDate(d.lastDonation) : "None recorded") },
          ]} />
      </Section>
    </div>
  );
}
