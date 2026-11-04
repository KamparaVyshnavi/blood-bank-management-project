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
import { useDemoData } from "@/components/providers/demo-data-provider";
import { fmtDateTime, relative } from "@/lib/format";
import type { AppUser, AuditEntry, Institution } from "@/lib/ops-types";

type Data = { now: number; users: AppUser[]; audit: AuditEntry[]; pendingInstitutions: Institution[]; cards: { users: number; active: number; pending: number } };

export function AdminView({ data }: { data: Data }) {
  const health = useHealth();
  const { data: sharedData, setData, resetDemoData } = useDemoData();
  const [toggle, setToggle] = useState<AppUser | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const now = data.now;
  const users = sharedData.users;
  const audit = sharedData.audit;
  const pendingInstitutions = sharedData.institutions.filter(i => i.status === "Pending");
  const activeInstitutions = sharedData.institutions.filter(i => i.status === "Active");

  const integrations = (health.detail?.integrations ?? {}) as Record<string, string>;
  const svc: [string, string][] = [["Application", health.text], ["Database (MongoDB)", integrations.atlas], ["Authentication (Clerk)", integrations.clerk], ["Background jobs (Inngest)", integrations.inngest]];

  function confirmToggleUser() {
    if (!toggle) return;
    const nextStatus = toggle.status === "Active" ? "Disabled" : "Active";
    const stamp = new Date(now).toISOString();
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => (u.id === toggle.id ? { ...u, status: nextStatus } : u)),
      audit: [
        {
          id: `e-${Date.now()}`,
          user: "Anita Rao",
          action: `${nextStatus === "Disabled" ? "Disabled" : "Enabled"} user`,
          record: toggle.email,
          at: stamp,
          result: "Success",
        },
        ...prev.audit,
      ],
    }));
    setToggle(null);
  }

  function verifyInstitution(inst: Institution) {
    const stamp = new Date(now).toISOString();
    setData(prev => ({
      ...prev,
      institutions: prev.institutions.map(i => i.id === inst.id ? { ...i, status: "Active", lastActivity: stamp } : i),
      audit: [
        { id: `aud-${Date.now()}`, user: "Anita Rao", action: "Verified institution", record: inst.name, at: stamp, result: "Success" },
        ...prev.audit,
      ],
    }));
  }

  return (
    <div className="ds-page">
      <PageHeader title="Administration" description="Users, institution approvals, the audit log and system health.">
        <button className="ds-btn ds-btn-danger-quiet" onClick={() => setConfirmReset(true)}>
          Reset demo data
        </button>
      </PageHeader>
      <PlaceholderNote>User and audit data is managed locally in your browser. System health below comes from the running app.</PlaceholderNote>
      <StatGrid>
        <SummaryCard label="Registered users" value={users.length} note="Across all roles" />
        <SummaryCard label="Active institutions" value={activeInstitutions.length} note="Can send and receive requests" />
        <SummaryCard label="Pending approvals" value={pendingInstitutions.length} note="Institutions awaiting verification" tone={pendingInstitutions.length ? "warn" : "ok"} />
        <SummaryCard label="System" value={health.text} note="From the live health check" tone={health.tone === "healthy" ? "ok" : health.tone === "critical" ? "critical" : "default"} />
      </StatGrid>

      <Section title="Users" flush>
        <DataTable caption="Users" rows={users} rowKey={u => u.id}
          columns={[
            { key: "n", header: "User", render: u => u.name }, { key: "e", header: "Email", render: u => u.email }, { key: "r", header: "Role", render: u => u.role }, { key: "i", header: "Institution", render: u => u.institution },
            { key: "s", header: "Status", render: u => <StatusBadge tone={u.status === "Active" ? "healthy" : "neutral"}>{u.status}</StatusBadge> },
            { key: "l", header: "Last sign-in", render: u => (u.lastSignIn ? relative(u.lastSignIn, now) : "Never") },
            { key: "a", header: "Access", render: u => <button className="ds-btn ds-btn-small" onClick={() => setToggle(u)}>{u.status === "Active" ? "Disable" : "Enable"}</button> },
          ]} />
      </Section>

      <div className="ds-split ds-split-even">
        <Section title="Institution approvals" flush>
          <DataTable caption="Institutions awaiting approval" rows={pendingInstitutions} rowKey={i => i.id} empty="No institutions are waiting for approval."
            columns={[{ key: "n", header: "Institution", render: i => i.name }, { key: "t", header: "Type", render: i => i.type }, { key: "a", header: "Review", render: i => <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}><Link className="ds-link" href={`/institutions/${i.id}`}>Open</Link><button className="ds-btn ds-btn-small" onClick={() => verifyInstitution(i)}>Verify</button></span> }]} />
        </Section>
        <Section title="System health" hint="Live result from /api/health">
          <ul className="ds-services">{svc.map(([name, state]) => <li key={name}><span>{name}</span><StatusBadge tone={name === "Application" ? health.tone : "neutral"}>{name === "Application" ? state : state === "not-probed" || !state ? "Not checked" : state}</StatusBadge></li>)}</ul>
          <p className="ds-muted ds-fine">The health check currently confirms the app is running. Database, sign-in and job checks need backend probes before they can show a real status.</p>
        </Section>
      </div>

      <Section title="Audit log" flush>
        <DataTable caption="Audit log" rows={audit} rowKey={a => a.id}
          columns={[{ key: "u", header: "User", render: a => a.user }, { key: "a", header: "Action", render: a => a.action }, { key: "r", header: "Record", render: a => <span className="ds-id">{a.record}</span> }, { key: "t", header: "When", render: a => fmtDateTime(a.at) }, { key: "x", header: "Result", render: a => <StatusBadge tone={a.result === "Success" ? "healthy" : "critical"}>{a.result}</StatusBadge> }]} />
      </Section>

      <ConfirmDialog open={!!toggle} title={toggle?.status === "Active" ? "Disable this user?" : "Enable this user?"} message={toggle ? (toggle.status === "Active" ? `${toggle.name} will be signed out and won’t be able to sign in until re-enabled.` : `${toggle.name} will be able to sign in again.`) : ""} confirmLabel={toggle?.status === "Active" ? "Disable user" : "Enable user"} danger={toggle?.status === "Active"} onConfirm={confirmToggleUser} onClose={() => setToggle(null)} />
      <ConfirmDialog open={confirmReset} title="Reset demo data to default?" message="All newly created emergencies, registered donors, and operational edits will be reset to the original sample dataset." confirmLabel="Reset demo data" danger onConfirm={() => { resetDemoData(); setConfirmReset(false); }} onClose={() => setConfirmReset(false)} />
    </div>
  );
}
