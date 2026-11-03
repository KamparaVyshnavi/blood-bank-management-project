"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader, Section } from "../ds/page-header";
import { StatGrid, SummaryCard } from "../ds/summary-card";
import { DataTable } from "../ds/data-table";
import { StatusBadge } from "../ui/status-badge";
import { ConfirmDialog } from "../ds/confirm-dialog";
import { PlaceholderNote } from "../ds/placeholder-note";
import { useHealth } from "../ds/health-indicator";
import { fmtDateTime, relative } from "@/lib/format";
import type { AppUser, AuditEntry, Institution } from "@/lib/ops-types";

type Data = { now: number; users: AppUser[]; audit: AuditEntry[]; pendingInstitutions: Institution[]; cards: { users: number; active: number; pending: number } };

export function AdminView({ data }: { data: Data }) {
  const health = useHealth();
  const [users, setUsers] = useState(data.users);
  const [toggle, setToggle] = useState<AppUser | null>(null);
  const integrations = (health.detail?.integrations ?? {}) as Record<string, string>;
  const svc: [string, string][] = [["Application", health.text], ["Database (MongoDB)", integrations.atlas], ["Authentication (Clerk)", integrations.clerk], ["Background jobs (Inngest)", integrations.inngest]];

  return (
    <div className="ds-page">
      <PageHeader title="Administration" description="Users, institution approvals, the audit log and system health." />
      <PlaceholderNote>User and audit data is sample data. System health below comes from the running app.</PlaceholderNote>
      <StatGrid>
        <SummaryCard label="Registered users" value={users.length} note="Across all roles" />
        <SummaryCard label="Active institutions" value={data.cards.active} note="Can send and receive requests" />
        <SummaryCard label="Pending approvals" value={data.cards.pending} note="Institutions awaiting verification" tone={data.cards.pending ? "warn" : "ok"} />
        <SummaryCard label="System" value={health.text} note="From the live health check" tone={health.tone === "healthy" ? "ok" : health.tone === "critical" ? "critical" : "default"} />
      </StatGrid>

      <Section title="Users" flush>
        <DataTable caption="Users" rows={users} rowKey={u => u.id}
          columns={[
            { key: "n", header: "User", render: u => u.name }, { key: "e", header: "Email", render: u => u.email }, { key: "r", header: "Role", render: u => u.role }, { key: "i", header: "Institution", render: u => u.institution },
            { key: "s", header: "Status", render: u => <StatusBadge tone={u.status === "Active" ? "healthy" : "neutral"}>{u.status}</StatusBadge> },
            { key: "l", header: "Last sign-in", render: u => (u.lastSignIn ? relative(u.lastSignIn, data.now) : "Never") },
            { key: "a", header: "Access", render: u => <button className="ds-btn ds-btn-small" onClick={() => setToggle(u)}>{u.status === "Active" ? "Disable" : "Enable"}</button> },
          ]} />
      </Section>

      <div className="ds-split ds-split-even">
        <Section title="Institution approvals" flush>
          <DataTable caption="Institutions awaiting approval" rows={data.pendingInstitutions} rowKey={i => i.id} empty="No institutions are waiting for approval."
            columns={[{ key: "n", header: "Institution", render: i => i.name }, { key: "t", header: "Type", render: i => i.type }, { key: "a", header: "Review", render: i => <Link className="ds-link" href={`/institutions/${i.id}`}>Open</Link> }]} />
        </Section>
        <Section title="System health" hint="Live result from /api/health">
          <ul className="ds-services">{svc.map(([name, state]) => <li key={name}><span>{name}</span><StatusBadge tone={name === "Application" ? health.tone : "neutral"}>{name === "Application" ? state : state === "not-probed" || !state ? "Not checked" : state}</StatusBadge></li>)}</ul>
          <p className="ds-muted ds-fine">The health check currently confirms the app is running. Database, sign-in and job checks need backend probes before they can show a real status.</p>
        </Section>
      </div>

      <Section title="Audit log" flush>
        <DataTable caption="Audit log" rows={data.audit} rowKey={a => a.id}
          columns={[{ key: "u", header: "User", render: a => a.user }, { key: "a", header: "Action", render: a => a.action }, { key: "r", header: "Record", render: a => <span className="ds-id">{a.record}</span> }, { key: "t", header: "When", render: a => fmtDateTime(a.at) }, { key: "x", header: "Result", render: a => <StatusBadge tone={a.result === "Success" ? "healthy" : "critical"}>{a.result}</StatusBadge> }]} />
      </Section>

      <ConfirmDialog open={!!toggle} title={toggle?.status === "Active" ? "Disable this user?" : "Enable this user?"} message={toggle ? (toggle.status === "Active" ? `${toggle.name} will be signed out and won’t be able to sign in until re-enabled.` : `${toggle.name} will be able to sign in again.`) : ""} confirmLabel={toggle?.status === "Active" ? "Disable user" : "Enable user"} danger={toggle?.status === "Active"} onConfirm={() => toggle && setUsers(l => l.map(u => (u.id === toggle.id ? { ...u, status: u.status === "Active" ? "Disabled" : "Active" } : u)))} onClose={() => setToggle(null)} />
    </div>
  );
}
