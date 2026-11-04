import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Section } from "@/components/ds/page-header";
import { StatGrid, SummaryCard } from "@/components/ds/summary-card";
import { DataTable } from "@/components/ds/data-table";
import { BloodTag, EmergencyStatusBadge, LevelBadge, UrgencyBadge } from "@/components/ds/status";
import { HBars, VBars } from "@/components/ds/charts";
import { fmtDay, relative } from "@/lib/format";
import { getOverview } from "@/lib/ops-data";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const o = await getOverview();
  if (!o) notFound();
  return (
    <div className="ds-page">
      <PageHeader title="Overview" description="Current stock, open emergencies and what needs attention.">
        {o.canCreate && <Link className="ds-btn ds-btn-primary" href="/emergencies?new=1">New emergency request</Link>}
      </PageHeader>

      <StatGrid>
        <SummaryCard label="Available units" value={o.cards.available} note={o.inventoryVisible ? "Usable stock in your authorized inventory scope" : "Inventory counts are not available to hospital accounts"} href="/inventory" />
        <SummaryCard label="Active emergencies" value={o.cards.activeEmergencies} note={`${o.cards.criticalEmergencies} marked critical`} tone={o.cards.criticalEmergencies ? "critical" : "default"} href="/emergencies" />
        <SummaryCard label="Institutions in scope" value={o.cards.institutions} note={`${o.cards.hospitals} hospitals, ${o.cards.banks} blood banks in your authorized scope; approval status is not stored`} href="/institutions" />
        <SummaryCard label="Open requests" value={o.cards.pending} note="Non-terminal requests in your authorized scope" tone={o.cards.pending ? "warn" : "ok"} />
      </StatGrid>

      <div className="ds-split">
        <Section title="Recent emergencies" flush action={<Link className="ds-link" href="/emergencies">View all</Link>}>
          <DataTable caption="Recent emergency requests" rows={o.recentEmergencies} rowKey={e => e.id} rowHref={e => `/emergencies/${e.id}`}
            columns={[
              { key: "id", header: "Request", render: e => <span className="ds-id">{e.id}</span> },
              { key: "hospital", header: "Hospital", render: e => e.hospital },
              { key: "need", header: "Needed", render: e => <><BloodTag group={e.group} /> <span className="ds-muted">× {e.units}</span></> },
              { key: "urgency", header: "Urgency", render: e => <UrgencyBadge urgency={e.urgency} /> },
              { key: "status", header: "Status", render: e => <EmergencyStatusBadge status={e.status} /> },
            ]} />
        </Section>
        <Section title="Inventory alerts" hint="Blood groups that need stock" flush>
          <DataTable caption="Blood groups with low stock" rows={o.alerts} rowKey={g => g.group} empty={o.inventoryVisible ? "No stock alerts in the authorized inventory scope." : "Inventory details are not available to hospital accounts."}
            columns={[
              { key: "g", header: "Group", render: g => <BloodTag group={g.group} /> },
              { key: "a", header: "Available", align: "right", render: g => g.available },
              { key: "e", header: "Expiring ≤ 3 days", align: "right", render: g => g.expiringSoon },
              { key: "s", header: "Status", render: g => <LevelBadge level={g.level} /> },
            ]} />
        </Section>
      </div>

      <div className="ds-split">
        <Section title="Stock by blood group" hint="Available and reserved units">
          <HBars label="Units by blood group" rows={o.groups.map(g => ({ label: g.group, segments: [{ key: "Available", value: g.available }, { key: "Reserved", value: g.reserved }] }))} />
        </Section>
        <Section title="Emergency requests, last 14 days" hint="By urgency">
          <VBars label="Emergency requests per day by urgency" keys={["Critical", "High", "Normal"]} data={o.requestsByDay.map(d => ({ label: fmtDay(d.day), segments: [{ key: "Normal", value: d.Normal }, { key: "High", value: d.High }, { key: "Critical", value: d.Critical }] }))} />
        </Section>
      </div>

      <div className="ds-split">
        <Section title="Pending actions" flush>
          <DataTable caption="Pending actions" rows={o.pending} rowKey={p => p.id}
            columns={[
              { key: "action", header: "Action required", render: p => <Link className="ds-link" href={p.href}>{p.action}</Link> },
              { key: "owner", header: "Responsible", render: p => p.owner },
              { key: "due", header: "Due", render: p => relative(p.due, o.now) },
            ]} />
        </Section>
        <Section title="Recent activity" flush>
          {o.activity.length ? <ul className="ds-feed">{o.activity.map(a => <li key={a.id}><span className={`ds-feed-dot tone-${a.tone}`} aria-hidden="true" /><div><p>{a.text}</p><span>{a.institution} · {relative(a.at, o.now)}</span></div></li>)}</ul> : <p className="ds-muted">No user activity log is stored in the current registry schema.</p>}
        </Section>
      </div>
    </div>
  );
}
