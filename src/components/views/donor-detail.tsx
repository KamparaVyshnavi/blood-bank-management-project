"use client";

import { PageHeader, Section } from "../ds/page-header";
import { BloodTag } from "../ds/status";
import { StatusBadge } from "../ui/status-badge";
import { fmtDate } from "@/lib/format";
import type { Donor } from "@/lib/ops-types";

export function DonorDetail({ donor, now }: { donor: Donor; now: number }) {
  const eligibleNow = Date.parse(donor.eligibleFrom) <= now;
  return (
    <div className="ds-page">
      <PageHeader title={donor.nickname} description={`Anonymous donor record · ${donor.id}`} back={{ href: "/donors", label: "All donors" }} />
      <div className="ds-split ds-split-even">
        <Section title="Registry information"><dl className="ds-dl">
          <dt>Blood group</dt><dd><BloodTag group={donor.group} /></dd>
          <dt>Identity</dt><dd>Anonymous nickname only</dd>
          <dt>Contact</dt><dd>Not collected by this registry</dd>
          <dt>Precise location</dt><dd>Not displayed</dd>
          <dt>Emergency alerts</dt><dd><StatusBadge tone={donor.alertsEnabled ? "healthy" : "neutral"}>{donor.alertsEnabled ? "Enabled" : "Disabled"}</StatusBadge></dd>
        </dl></Section>
        <Section title="Eligibility and donation history"><dl className="ds-dl">
          <dt>Eligible from</dt><dd>{fmtDate(donor.eligibleFrom)}</dd>
          <dt>Eligibility date reached</dt><dd>{eligibleNow ? "Yes; this is not a medical clearance" : "Not yet"}</dd>
          <dt>Last donation</dt><dd>{donor.lastDonationAt ? fmtDate(donor.lastDonationAt) : "Not recorded"}</dd>
        </dl></Section>
      </div>
      <Section title="Emergency communication"><dl className="ds-dl">
        <dt>Alerts sent</dt><dd>{donor.alertsSent}</dd>
        <dt>Alerts answered</dt><dd>{donor.alertsAnswered}</dd>
      </dl></Section>
    </div>
  );
}
