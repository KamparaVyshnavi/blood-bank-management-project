"use client";

import { useMemo, useState } from "react";
import { PageHeader, Section } from "../ds/page-header";
import { StatGrid, SummaryCard } from "../ds/summary-card";
import { DataTable } from "../ds/data-table";
import { InstitutionStatusBadge } from "../ds/status";
import { FilterBar, SearchBox, SelectFilter } from "../ds/filter-bar";
import { relative } from "@/lib/format";
import type { Institution } from "@/lib/ops-types";

export function InstitutionsView({ items, cards, now, scopeNote }: { items: Institution[]; cards: { hospitals: number | string; banks: number }; now: number; scopeNote: string }) {
  const [q, setQ] = useState(""); const [type, setType] = useState("ALL");
  const rows = useMemo(() => items.filter(i => (!q || `${i.name} ${i.district}`.toLowerCase().includes(q.toLowerCase())) && (type === "ALL" || i.type === type)), [items, q, type]);
  return (
    <div className="ds-page">
      <PageHeader title="Hospitals & blood banks" description={scopeNote + ". Unsupported registration and approval fields are not fabricated."} />
      <StatGrid>
        <SummaryCard label="Hospitals" value={cards.hospitals} note={typeof cards.hospitals === "number" ? "In the authorized registry scope" : "Not available to bank accounts"} />
        <SummaryCard label="Blood banks" value={cards.banks} note="In the authorized registry scope" />
        <SummaryCard label="Approval status" value="Not tracked" note="The current institution schema has no approval field" />
        <SummaryCard label="Contact details" value="Not stored" note="No contact or administrator fields exist in the registry schema" />
      </StatGrid>
      <Section title="Directory" flush>
        <div className="ds-card-pad">
          <FilterBar count={rows.length} total={items.length} noun="institutions">
            <SearchBox label="Search institutions" placeholder="Name or district" value={q} onChange={setQ} />
            <SelectFilter label="Type" all="All types" options={["Hospital", "Blood bank"]} value={type} onChange={setType} />
          </FilterBar>
        </div>
        <DataTable caption="Registered institutions" rows={rows} rowKey={i => i.id} rowHref={i => `/institutions/${i.id}`} empty="No institutions match these filters."
          columns={[
            { key: "name", header: "Institution", render: i => i.name },
            { key: "type", header: "Type", render: i => i.type },
            { key: "reg", header: "Registration ID", render: i => <span className="ds-id">{i.regId}</span> },
            { key: "loc", header: "Location", render: i => i.district },
            { key: "status", header: "Status", render: i => <InstitutionStatusBadge status={i.status} /> },
            { key: "last", header: "Last activity", render: i => i.lastActivity ? relative(i.lastActivity, now) : "Not recorded" },
          ]} />
      </Section>
    </div>
  );
}
