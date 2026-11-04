"use client";

import { useMemo, useState } from "react";
import { PageHeader, Section } from "../ds/page-header";
import { StatGrid, SummaryCard } from "../ds/summary-card";
import { DataTable } from "../ds/data-table";
import { InstitutionStatusBadge } from "../ds/status";
import { FilterBar, SearchBox, SelectFilter } from "../ds/filter-bar";
import { Dialog } from "../ds/confirm-dialog";
import { useDemoData } from "@/components/providers/demo-data-provider";
import { relative } from "@/lib/format";
import type { Institution, InstitutionType } from "@/lib/ops-types";

const DISTRICTS = ["Mumbai City", "Mumbai Suburban", "Thane", "Pune", "Nagpur", "Nashik", "Aurangabad"];

const EMPTY_FORM = { name: "", type: "Hospital" as InstitutionType, regId: "", district: "Mumbai City", state: "Maharashtra", contact: "" };

export function InstitutionsView({ now }: { items?: Institution[]; cards?: { hospitals: number; banks: number; active: number; attention: number }; now: number }) {
  const { data, setData } = useDemoData();
  const items = data.institutions;

  const cards = {
    hospitals: items.filter(i => i.type === "Hospital").length,
    banks: items.filter(i => i.type === "Blood bank").length,
    active: items.filter(i => i.status === "Active").length,
    attention: items.filter(i => i.status !== "Active").length,
  };

  const [q, setQ] = useState(""); const [type, setType] = useState("ALL"); const [status, setStatus] = useState("ALL");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [toast, setToast] = useState("");

  const rows = useMemo(() => items.filter(i => (!q || `${i.name} ${i.regId} ${i.district}`.toLowerCase().includes(q.toLowerCase())) && (type === "ALL" || i.type === type) && (status === "ALL" || i.status === status)), [items, q, type, status]);

  function openAdding() { setForm({ ...EMPTY_FORM }); setAdding(true); }
  function closeAdding() { setAdding(false); setForm({ ...EMPTY_FORM }); }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    const stamp = new Date(now).toISOString();
    const maxId = data.institutions.reduce((acc, i) => {
      const n = parseInt(i.id.replace(/\D/g, ""), 10);
      return isNaN(n) ? acc : Math.max(acc, n);
    }, 0);
    const newInst: Institution = {
      id: `inst-${maxId + 1}`,
      name: form.name.trim(),
      type: form.type,
      regId: form.regId.trim(),
      district: form.district,
      state: form.state.trim(),
      contact: form.contact.trim(),
      status: "Pending",
      lastActivity: stamp,
      admins: [],
    };
    setData(prev => ({
      ...prev,
      institutions: [...prev.institutions, newInst],
      activity: [
        { id: `act-${Date.now()}`, text: `${newInst.name} registered (pending verification)`, institution: newInst.name, at: stamp, tone: "info" as const },
        ...prev.activity,
      ],
      audit: [
        { id: `aud-${Date.now()}`, user: "Anita Rao", action: "Registered institution", record: newInst.name, at: stamp, result: "Success" },
        ...prev.audit,
      ],
    }));
    setToast(`${newInst.name} added. Pending verification.`);
    setTimeout(() => setToast(""), 4000);
    closeAdding();
  }

  return (
    <div className="ds-page">
      <PageHeader title="Hospitals & blood banks" description="Registered institutions, their status and recent activity.">
        <button className="ds-btn ds-btn-primary" onClick={openAdding}>Add institution</button>
      </PageHeader>
      {toast && <div className="ds-toast ds-toast-ok" role="status">{toast}</div>}
      <StatGrid>
        <SummaryCard label="Hospitals" value={cards.hospitals} note="Registered" />
        <SummaryCard label="Blood banks" value={cards.banks} note="Registered" />
        <SummaryCard label="Active" value={cards.active} note="Allowed to send and receive requests" tone="ok" />
        <SummaryCard label="Need attention" value={cards.attention} note="Pending verification or suspended" tone={cards.attention ? "warn" : "ok"} />
      </StatGrid>
      <Section title="Directory" flush>
        <div className="ds-card-pad">
          <FilterBar count={rows.length} total={items.length} noun="institutions">
            <SearchBox label="Search institutions" placeholder="Name, registration ID or district" value={q} onChange={setQ} />
            <SelectFilter label="Type" all="All types" options={["Hospital", "Blood bank"]} value={type} onChange={setType} />
            <SelectFilter label="Status" all="All statuses" options={["Active", "Pending", "Suspended"]} value={status} onChange={setStatus} />
          </FilterBar>
        </div>
        <DataTable caption="Registered institutions" rows={rows} rowKey={i => i.id} rowHref={i => `/institutions/${i.id}`} empty="No institutions match these filters."
          columns={[
            { key: "name", header: "Institution", render: i => i.name },
            { key: "type", header: "Type", render: i => i.type },
            { key: "reg", header: "Registration ID", render: i => <span className="ds-id">{i.regId}</span> },
            { key: "loc", header: "Location", render: i => `${i.district}, ${i.state}` },
            { key: "status", header: "Status", render: i => <InstitutionStatusBadge status={i.status} /> },
            { key: "last", header: "Last activity", render: i => relative(i.lastActivity, now) },
          ]} />
      </Section>

      <Dialog open={adding} title="Register institution" onClose={closeAdding}
        footer={
          <div className="ds-dialog-foot">
            <button type="submit" form="add-institution-form" className="ds-btn ds-btn-primary">Register</button>
            <button type="button" className="ds-btn ds-btn-quiet" onClick={closeAdding}>Cancel</button>
          </div>
        }>
        <form id="add-institution-form" className="ds-form" onSubmit={submitAdd}>
          <label><span>Institution name *</span><input className="ds-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sunrise Blood Bank" /></label>
          <div className="ds-form-row">
            <label className="ds-select"><span>Type *</span>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as InstitutionType }))}>
                <option value="Hospital">Hospital</option>
                <option value="Blood bank">Blood bank</option>
              </select>
            </label>
            <label><span>Registration ID *</span><input className="ds-input" required value={form.regId} onChange={e => setForm(f => ({ ...f, regId: e.target.value }))} placeholder="e.g. MH-BB-0401" /></label>
          </div>
          <div className="ds-form-row">
            <label className="ds-select"><span>District *</span>
              <select value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label><span>State *</span><input className="ds-input" required value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="e.g. Maharashtra" /></label>
          </div>
          <label><span>Contact</span><input className="ds-input" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="+91 22 5550 0000" /></label>
        </form>
      </Dialog>
    </div>
  );
}

