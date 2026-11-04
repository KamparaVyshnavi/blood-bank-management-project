"use client";

import { PageHeader, Section } from "../ds/page-header";
import { StatGrid, SummaryCard } from "../ds/summary-card";
import { DataTable } from "../ds/data-table";
import { StatusBadge } from "../ui/status-badge";
import { useHealth } from "../ds/health-indicator";
import type { AppUser } from "@/lib/ops-types";
import { fmtDateTime } from "@/lib/format";

export function AdminView({ users, directoryStatus, directoryTotal, directoryTruncated }: {
  users: AppUser[];
  directoryStatus: "available" | "unavailable";
  directoryTotal: number | null;
  directoryTruncated: boolean;
}) {
  const health = useHealth();
  const integrations = (health.detail?.integrations ?? {}) as Record<string, string>;
  const services: [string, string][] = [["Application", health.text], ["Database (MongoDB)", integrations.atlas], ["Authentication (Clerk)", integrations.clerk], ["Background jobs (Inngest)", integrations.inngest]];
  return (
    <div className="ds-page">
      <PageHeader title="Administration" description="Live system health and the boundaries of the current administrative data model." />
      <StatGrid>
        <SummaryCard label="Clerk accounts" value={directoryStatus === "available" ? (directoryTotal ?? users.length) : "Unavailable"} note={directoryStatus === "available" ? "Read-only state-scoped Clerk directory; donor accounts are withheld." : "Clerk directory could not be loaded."} />
        <SummaryCard label="Institution approvals" value="Not tracked" note="The institution registry has no approval or suspension field." />
        <SummaryCard label="User activity audit" value="Not tracked" note="Unit provenance events are not user click or administration logs." />
        <SummaryCard label="System" value={health.text} note="From the live health check" tone={health.tone === "healthy" ? "ok" : health.tone === "critical" ? "critical" : "default"} />
      </StatGrid>
      <Section title="Clerk user directory" hint="Read-only state-scoped account projection. Donor accounts are omitted to preserve anonymity; raw metadata, phone numbers and authentication secrets are never exposed.">
        {directoryStatus === "unavailable" ? <p className="ds-muted">The Clerk user directory is temporarily unavailable. No account data is being inferred.</p> : <>
          {directoryTruncated && <p className="ds-muted ds-fine">Showing matching accounts found among the 500 most recent Clerk accounts. Older accounts may be omitted.</p>}
          <DataTable caption="Clerk user directory" rows={users} rowKey={user => user.id} empty="No Clerk accounts were returned."
            columns={[
              { key: "name", header: "User", render: user => <><strong>{user.name}</strong><span className="ds-muted ds-fine">{user.id}</span></> },
              { key: "email", header: "Email", render: user => user.email },
              { key: "role", header: "Registry role", render: user => user.role },
              { key: "institution", header: "Registry scope", render: user => user.institution },
              { key: "status", header: "Clerk status", render: user => <StatusBadge tone={user.status === "Active" ? "healthy" : user.status === "Locked" ? "low" : "critical"}>{user.status}</StatusBadge> },
              { key: "last", header: "Last sign-in", render: user => user.lastSignIn ? fmtDateTime(user.lastSignIn) : "Never recorded" },
            ]} />
        </>}
      </Section>
      <Section title="System health" hint="Live result from /api/health">
        <ul className="ds-services">{services.map(([name, state]) => <li key={name}><span>{name}</span><StatusBadge tone={name === "Application" ? health.tone : "neutral"}>{name === "Application" ? state : state === "not-probed" || !state ? "Not checked" : state}</StatusBadge></li>)}</ul>
        <p className="ds-muted ds-fine">The health check confirms whether the application is running. Database, sign-in and background-job availability are not claimed unless the corresponding backend probe reports them.</p>
      </Section>
    </div>
  );
}
