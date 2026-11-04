"use client";

import { useMemo, useState } from "react";
import { PageHeader, Section } from "../ds/page-header";
import { StatGrid, SummaryCard } from "../ds/summary-card";
import { DataTable } from "../ds/data-table";
import { BloodTag } from "../ds/status";
import { StatusBadge } from "../ui/status-badge";
import { FilterBar, SearchBox, SelectFilter } from "../ds/filter-bar";
import { useDemoData } from "@/components/providers/demo-data-provider";
import { Dialog } from "../ds/confirm-dialog";
import { Icon } from "../ds/icons";
import { PlaceholderNote } from "../ds/placeholder-note";
import { fmtDate } from "@/lib/format";
import { BLOOD_GROUPS, type BloodGroup, type Donor } from "@/lib/ops-types";

export function DonorsView({ now }: { items?: Donor[]; cards?: { registered: number; available: number; subscribed: number; pending: number }; now: number }) {
  const { data, setData } = useDemoData();
  const items = data.donors;

  const [q, setQ] = useState("");
  const [group, setGroup] = useState("ALL");
  const [avail, setAvail] = useState("ALL");
  const [ver, setVer] = useState("ALL");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");

  const cards = {
    registered: items.length,
    available: items.filter(d => d.available).length,
    subscribed: items.filter(d => d.subscribed).length,
    pending: items.filter(d => !d.verified).length,
  };

  const rows = useMemo(() => items.filter(d =>
    (!q || `${d.name} ${d.id}`.toLowerCase().includes(q.toLowerCase())) &&
    (group === "ALL" || d.group === group) &&
    (avail === "ALL" || (avail === "Available") === d.available) &&
    (ver === "ALL" || (ver === "Verified") === d.verified)
  ), [items, q, group, avail, ver]);

  function registerDonor(form: FormData) {
    const name = String(form.get("name")).trim();
    const groupVal = form.get("group") as BloodGroup;
    const district = String(form.get("district"));
    const phone = String(form.get("phone")).trim();
    const lastDonationVal = form.get("lastDonation") ? String(form.get("lastDonation")) : "";
    const lastDonation = lastDonationVal ? new Date(lastDonationVal).toISOString() : null;
    const nextEligible = lastDonation ? new Date(Date.parse(lastDonation) + 90 * 86400000).toISOString() : null;

    const digits = phone.replace(/\D/g, "");
    const last4 = digits.length >= 4 ? digits.slice(-4) : "1001";
    const contactMasked = `+91 ••••• ${last4}`;

    const maxId = items.reduce((max, d) => {
      const n = parseInt(d.id.replace(/\D/g, ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 3100);
    const id = `D-${maxId + 1}`;

    const newDonor: Donor = {
      id,
      name,
      group: groupVal,
      district,
      available: form.get("available") !== null,
      subscribed: form.get("subscribed") !== null,
      verified: false,
      lastDonation,
      nextEligible,
      contactMasked,
      alertsSent: 0,
      alertsAnswered: 0,
    };

    setData(prev => ({
      ...prev,
      donors: [newDonor, ...prev.donors],
      activity: [
        {
          id: `a-${Date.now()}`,
          text: `New donor registered: ${name} (${groupVal})`,
          institution: "State blood programme",
          at: new Date(now).toISOString(),
          tone: "ok",
        },
        ...prev.activity,
      ],
      audit: [
        {
          id: `e-${Date.now()}`,
          user: "Anita Rao",
          action: "Registered donor record",
          record: id,
          at: new Date(now).toISOString(),
          result: "Success",
        },
        ...prev.audit,
      ],
    }));

    setAdding(false);
    setToast(`${name} (${id}) registered successfully.`);
  }

  return (
    <div className="ds-page">
      <PageHeader title="Donors" description="Donor records and who can be alerted. Contact details stay masked in lists.">
        <button className="ds-btn ds-btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} />Register donor
        </button>
      </PageHeader>
      <PlaceholderNote />
      {toast && <p className="ds-toast" role="status">{toast}</p>}
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

      <Dialog open={adding} title="Register new donor" onClose={() => setAdding(false)}>
        <form className="ds-form" onSubmit={e => { e.preventDefault(); registerDonor(new FormData(e.currentTarget)); }}>
          <label>Donor name<input name="name" type="text" placeholder="e.g. Priya Sharma" required /></label>
          <div className="ds-form-row">
            <label>Blood group<select name="group" required>{BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}</select></label>
            <label>District<select name="district" required>{["Mumbai City", "Mumbai Suburban", "Thane", "Pune"].map(d => <option key={d}>{d}</option>)}</select></label>
          </div>
          <div className="ds-form-row">
            <label>Contact phone<input name="phone" type="tel" placeholder="e.g. 9876543210" required /></label>
            <label>Last donation date<input name="lastDonation" type="date" /></label>
          </div>
          <div className="ds-form-row">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}><input name="available" type="checkbox" defaultChecked /><span>Available for donation</span></label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}><input name="subscribed" type="checkbox" defaultChecked /><span>Subscribed to alerts</span></label>
          </div>
          <div className="ds-dialog-foot">
            <button type="button" className="ds-btn ds-btn-quiet" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="ds-btn ds-btn-primary">Register donor</button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
