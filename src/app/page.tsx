
"use client";

import Link from "next/link";
import { useDemoData } from "@/components/providers/demo-data-provider";
import { PageHeader, Section } from "@/components/ds/page-header";
import { StatGrid, SummaryCard } from "@/components/ds/summary-card";
import { DataTable } from "@/components/ds/data-table";
import {
  BloodTag,
  EmergencyStatusBadge,
  LevelBadge,
  UrgencyBadge,
} from "@/components/ds/status";
import { HBars, VBars } from "@/components/ds/charts";
import { fmtDay, relative } from "@/lib/format";
import { groupRows } from "@/lib/inventory-math";

export default function OverviewPage() {
  const { data } = useDemoData();
  const now = Date.now();

  const units = data.units;
  const emergencies = data.emergencies;
  const institutions = data.institutions;

  const groups = groupRows(units, now);

  const openEmergencies = emergencies.filter((e) =>
    ["Submitted", "Processing", "Awaiting response", "Partially fulfilled"].includes(e.status)
  );

  const activeInstitutions = institutions.filter(
    (i) => i.status === "Active"
  );

  const banks = activeInstitutions.filter(
    (i) => i.type === "Blood bank"
  );

  const hospitals = activeInstitutions.filter(
    (i) => i.type === "Hospital"
  );

  const recentEmergencies = [...emergencies]
    .sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt)
    )
    .slice(0, 5);

  const alerts = groups.filter((g) => g.level !== "ok");

  const requestsByDay = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (13 - i));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const requests = emergencies.filter((e) => {
      const created = Date.parse(e.createdAt);
      return created >= date.getTime() && created < nextDate.getTime();
    });

    return {
      day: date.toISOString(),
      Critical: requests.filter((e) => e.urgency === "Critical").length,
      High: requests.filter((e) => e.urgency === "High").length,
      Normal: requests.filter((e) => e.urgency === "Normal").length,
    };
  });

  const cards = {
    available: units.filter((u) => u.status === "Available").length,
    activeEmergencies: openEmergencies.length,
    criticalEmergencies: openEmergencies.filter(
      (e) => e.urgency === "Critical"
    ).length,
    institutions: activeInstitutions.length,
    hospitals: hospitals.length,
    banks: banks.length,
    pending: data.pending.length,
  };

  return (
    <div className="ds-page">
      <PageHeader
        title="Overview"
        description="Current stock, open emergencies and what needs attention."
      >
        <Link className="ds-btn ds-btn-primary" href="/emergencies?new=1">
          New emergency request
        </Link>
        <Link className="ds-btn" href="/inventory?add=1">
          Add inventory
        </Link>
      </PageHeader>

      <StatGrid>
        <SummaryCard
          label="Available units"
          value={cards.available}
          note="Usable stock across all banks"
          href="/inventory"
        />
        <SummaryCard
          label="Active emergencies"
          value={cards.activeEmergencies}
          note={`${cards.criticalEmergencies} marked critical`}
          tone={cards.criticalEmergencies ? "critical" : "default"}
          href="/emergencies"
        />
        <SummaryCard
          label="Active institutions"
          value={cards.institutions}
          note={`${cards.hospitals} hospitals, ${cards.banks} blood banks`}
          href="/institutions"
        />
        <SummaryCard
          label="Pending actions"
          value={cards.pending}
          note="Waiting on a person"
          tone={cards.pending ? "warn" : "ok"}
        />
      </StatGrid>

      <div className="ds-split">
        <Section
          title="Recent emergencies"
          flush
          action={
            <Link className="ds-link" href="/emergencies">
              View all
            </Link>
          }
        >
          <DataTable
            caption="Recent emergency requests"
            rows={recentEmergencies}
            rowKey={(e) => e.id}
            rowHref={(e) => `/emergencies/${e.id}`}
            columns={[
              {
                key: "id",
                header: "Request",
                render: (e) => <span className="ds-id">{e.id}</span>,
              },
              {
                key: "hospital",
                header: "Hospital",
                render: (e) => e.hospital,
              },
              {
                key: "need",
                header: "Needed",
                render: (e) => (
                  <>
                    <BloodTag group={e.group} />{" "}
                    <span className="ds-muted">× {e.units}</span>
                  </>
                ),
              },
              {
                key: "urgency",
                header: "Urgency",
                render: (e) => <UrgencyBadge urgency={e.urgency} />,
              },
              {
                key: "status",
                header: "Status",
                render: (e) => (
                  <EmergencyStatusBadge status={e.status} />
                ),
              },
            ]}
          />
        </Section>

        <Section
          title="Inventory alerts"
          hint="Blood groups that need stock"
          flush
        >
          <DataTable
            caption="Blood groups with low stock"
            rows={alerts}
            rowKey={(g) => g.group}
            empty="Every blood group has healthy stock."
            columns={[
              {
                key: "g",
                header: "Group",
                render: (g) => <BloodTag group={g.group} />,
              },
              {
                key: "a",
                header: "Available",
                align: "right",
                render: (g) => g.available,
              },
              {
                key: "e",
                header: "Expiring ≤ 3 days",
                align: "right",
                render: (g) => g.expiringSoon,
              },
              {
                key: "s",
                header: "Status",
                render: (g) => <LevelBadge level={g.level} />,
              },
            ]}
          />
        </Section>
      </div>

      <div className="ds-split">
        <Section
          title="Stock by blood group"
          hint="Available and reserved units"
        >
          <HBars
            label="Units by blood group"
            rows={groups.map((g) => ({
              label: g.group,
              segments: [
                { key: "Available", value: g.available },
                { key: "Reserved", value: g.reserved },
              ],
            }))}
          />
        </Section>

        <Section
          title="Emergency requests, last 14 days"
          hint="By urgency"
        >
          <VBars
            label="Emergency requests per day by urgency"
            keys={["Critical", "High", "Normal"]}
            data={requestsByDay.map((d) => ({
              label: fmtDay(d.day),
              segments: [
                { key: "Normal", value: d.Normal },
                { key: "High", value: d.High },
                { key: "Critical", value: d.Critical },
              ],
            }))}
          />
        </Section>
      </div>

      <div className="ds-split">
        <Section title="Pending actions" flush>
          <DataTable
            caption="Pending actions"
            rows={data.pending}
            rowKey={(p) => p.id}
            columns={[
              {
                key: "action",
                header: "Action required",
                render: (p) => (
                  <Link className="ds-link" href={p.href}>
                    {p.action}
                  </Link>
                ),
              },
              {
                key: "owner",
                header: "Responsible",
                render: (p) => p.owner,
              },
              {
                key: "due",
                header: "Due",
                render: (p) => relative(p.due, now),
              },
            ]}
          />
        </Section>

        <Section title="Recent activity" flush>
          <ul className="ds-feed">
            {data.activity.map((a) => (
              <li key={a.id}>
                <span
                  className={`ds-feed-dot tone-${a.tone}`}
                  aria-hidden="true"
                />
                <div>
                  <p>{a.text}</p>
                  <span>
                    {a.institution} · {relative(a.at, now)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
