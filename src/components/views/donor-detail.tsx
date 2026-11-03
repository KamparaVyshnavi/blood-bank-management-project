"use client";

import { useState } from "react";
import { PageHeader, Section } from "../ds/page-header";
import { BloodTag } from "../ds/status";
import { StatusBadge } from "../ui/status-badge";
import { ConfirmDialog } from "../ds/confirm-dialog";
import { PlaceholderNote } from "../ds/placeholder-note";
import { fmtDate } from "@/lib/format";
import type { Donor } from "@/lib/ops-types";

export function DonorDetail({ donor, now }: { donor: Donor; now: number }) {
  const [d, setD] = useState(donor);
  const [verify, setVerify] = useState(false);
  const eligibleNow = d.nextEligible === null || Date.parse(d.nextEligible) <= now;
  return (
    <div className="ds-page">
      <PageHeader title={d.name} description={`Donor ${d.id} · ${d.district}`} back={{ href: "/donors", label: "All donors" }}>
        {!d.verified && <button className="ds-btn ds-btn-primary" onClick={() => setVerify(true)}>Verify record</button>}
        <button className="ds-btn" onClick={() => setD(x => ({ ...x, available: !x.available }))}>{d.available ? "Mark unavailable" : "Mark available"}</button>
        <button className="ds-btn" onClick={() => setD(x => ({ ...x, subscribed: !x.subscribed }))}>{d.subscribed ? "Turn off alerts" : "Turn on alerts"}</button>
      </PageHeader>
      <PlaceholderNote />
      <div className="ds-split ds-split-even">
        <Section title="Basic information"><dl className="ds-dl">
          <dt>Blood group</dt><dd><BloodTag group={d.group} /></dd>
          <dt>District</dt><dd>{d.district}</dd>
          <dt>Contact</dt><dd>{d.contactMasked} <span className="ds-muted">Full number is hidden for your role</span></dd>
          <dt>Record</dt><dd><StatusBadge tone={d.verified ? "healthy" : "low"}>{d.verified ? "Verified" : "Awaiting verification"}</StatusBadge></dd>
        </dl></Section>
        <Section title="Availability and eligibility"><dl className="ds-dl">
          <dt>Availability</dt><dd><StatusBadge tone={d.available ? "healthy" : "neutral"}>{d.available ? "Available" : "Unavailable"}</StatusBadge></dd>
          <dt>Last donation</dt><dd>{d.lastDonation ? fmtDate(d.lastDonation) : "None recorded"}</dd>
          <dt>Next eligible</dt><dd>{d.nextEligible ? (eligibleNow ? "Now, subject to screening" : fmtDate(d.nextEligible)) : "No donation on record"}</dd>
        </dl><p className="ds-muted ds-fine">Availability is the donor’s own preference. Medical eligibility is decided at screening.</p></Section>
      </div>
      <Section title="Communication"><dl className="ds-dl">
        <dt>Emergency alerts</dt><dd>{d.subscribed ? "Subscribed" : "Turned off"}</dd>
        <dt>Alerts sent</dt><dd>{d.alertsSent}</dd>
        <dt>Alerts answered</dt><dd>{d.alertsAnswered}</dd>
      </dl></Section>
      <ConfirmDialog open={verify} title="Verify this donor record?" message={`${d.name}’s details will be marked as checked. They can then be included in emergency alerts.`} confirmLabel="Verify record" onConfirm={() => setD(x => ({ ...x, verified: true }))} onClose={() => setVerify(false)} />
    </div>
  );
}
