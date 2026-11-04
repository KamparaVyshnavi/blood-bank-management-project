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

export function DonorsView({ items, cards }: { items: Donor[]; cards: { registered: number; eligibleNow: number; alertsEnabled: number } }) {
  const [q, setQ] = useState(""); const [group, setGroup] = useState("ALL"); const [alerts, setAlerts] = useState("ALL");
  const rows = useMemo(() => items.filter(d => (!q || `${d.nickname} ${d.id}`.toLowerCase().includes(q.toLowerCase())) && (group === "ALL" || d.group === group) && (alerts === "ALL" || (alerts === "Enabled") === d.alertsEnabled)), [items, q, group, alerts]);
  return (
    <div className="ds-page">
      <PageHeader title="Donors" description="Anonymous donor records. Names, phone numbers and precise locations are not part of the registry model." />
      <StatGrid>
        <SummaryCard label="Registered donors" value={cards.registered} note="Non-expired donor records in this state" />
        <SummaryCard label="Eligibility date reached" value={cards.eligibleNow} note="Calendar date only; not a clearance or availability claim" />
        <SummaryCard label="Emergency alerts enabled" value={cards.alertsEnabled} note="Anonymous records opted into the alert audience" />
      </StatGrid>
      <Section title="Anonymous donor records" flush>
        <div className="ds-card-pad"><FilterBar count={rows.length} total={items.length} noun="donors">
          <SearchBox label="Search donors" placeholder="Nickname or donor ID" value={q} onChange={setQ} />
          <SelectFilter label="Blood group" all="All groups" options={BLOOD_GROUPS} value={group} onChange={setGroup} />
          <SelectFilter label="Emergency alerts" all="Any setting" options={["Enabled", "Disabled"]} value={alerts} onChange={setAlerts} />
        </FilterBar></div>
        <DataTable caption="Anonymous donor records" rows={rows} rowKey={d => d.id} rowHref={d => `/donors/${d.id}`} empty="No anonymous donor records are available in this registry scope." columns={[
          { key: "nickname", header: "Nickname", render: d => d.nickname },
          { key: "id", header: "ID", render: d => <span className="ds-id">{d.id}</span> },
          { key: "group", header: "Group", render: d => <BloodTag group={d.group} /> },
          { key: "eligible", header: "Eligible from", render: d => fmtDate(d.eligibleFrom) },
          { key: "alerts", header: "Emergency alerts", render: d => <StatusBadge tone={d.alertsEnabled ? "healthy" : "neutral"}>{d.alertsEnabled ? "Enabled" : "Disabled"}</StatusBadge> },
          { key: "last", header: "Last donation", render: d => d.lastDonationAt ? fmtDate(d.lastDonationAt) : "Not recorded" },
        ]} />
      </Section>
    </div>
  );
}
