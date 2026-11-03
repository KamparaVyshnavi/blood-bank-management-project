"use client";

import { useState } from "react";
import { COMPONENTS, GROUPS, STATUSES, type Component, type Group } from "@/core/domain";
import { FIXTURE_NOW, fixtureBanks, fixtureRequest, inventoryFixtures } from "@/core/fixtures";
import { matchInventory } from "@/core/inventory";
import { issueLocalStock, releaseLocalStock, reserveLocalStock } from "@/core/local-registry";
import { StatusBadge } from "../ui/status-badge";

export function InventoryLab() {
  const [units, setUnits] = useState(inventoryFixtures);
  const [group, setGroup] = useState<Group>("A+");
  const [component, setComponent] = useState<Component>("PRBC");
  const [quantity, setQuantity] = useState(2);
  const [hours, setHours] = useState(2);
  const [status, setStatus] = useState("ALL");
  const [bank, setBank] = useState("ALL");
  const [query, setQuery] = useState("");
  const [activeRequest, setActiveRequest] = useState<ReturnType<typeof fixtureRequest> | null>(null);
  const [message, setMessage] = useState("Choose a recipient to inspect every candidate, then reserve local stock.");
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState("");
  const request = activeRequest ?? fixtureRequest(group, component, quantity, hours);
  const match = matchInventory(units, request, FIXTURE_NOW);
  const visible = match.assessments.filter(({ unit }) => (status === "ALL" || unit.status === status) && (bank === "ALL" || unit.bankId === bank) && unit.id.toLowerCase().includes(query.toLowerCase()));
  function operate(action: "reserve" | "issue" | "cancel") {
    try {
      const result = action === "reserve" ? reserveLocalStock(units, request, FIXTURE_NOW, `demo-${history.length}`) : action === "issue" ? issueLocalStock(units, request, FIXTURE_NOW, `demo-${history.length}`, true) : releaseLocalStock(units, request, FIXTURE_NOW, `demo-${history.length}`, "CANCEL");
      setUnits(result.units); setActiveRequest(action === "cancel" ? null : result.request);
      setHistory(previous => [...previous, ...result.events.map(event => `${event.unitId} · ${event.from} → ${event.to} · ${event.action}`)]);
      setMessage(action === "reserve" ? `${result.events.length} unit(s) reserved locally; ${match.shortage} still needed.` : action === "issue" ? `${result.events.length} unit(s) issued in preference and FEFO order.` : `${result.events.length} reservation(s) released.`);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Operation failed"); }
  }
  function reset() { setUnits(inventoryFixtures()); setActiveRequest(null); setHistory([]); setError(""); setStatus("ALL"); setBank("ALL"); setQuery(""); setMessage("Reset. All changes are local to this browser session."); }
  const reserved = units.filter(unit => unit.status === "RESERVED" && unit.reservation?.requestId === request.id).length;
  return <>
    <div className="page-heading"><div><h1>Matching lab</h1><p className="page-description">Inspect available stock, eligibility rules, and component lifecycles. <span className="status-badge status-low" style={{ verticalAlign: "middle" }}>Illustrative data — no live database connected</span></p></div><StatusBadge tone="low">Simulation mode</StatusBadge></div>
    <div className="notice">This view uses an illustrative local fixture to demonstrate inventory management logic. Connect MongoDB Atlas and configure Clerk to see real stock data via your authenticated portal.</div>
    <section className="panel lab-panel" aria-labelledby="selection-heading"><div className="lab-section-heading"><div><p className="eyebrow">MATCH & ISSUE</p><h2 id="selection-heading">Find eligible stock</h2></div><button className="button button-secondary" onClick={reset}>Reset</button></div>
      <div className="lab-controls"><label>Recipient group<select value={group} disabled={!!activeRequest} onChange={event => setGroup(event.target.value as Group)}>{GROUPS.map(item => <option key={item}>{item}</option>)}</select></label><label>Component<select value={component} disabled={!!activeRequest} onChange={event => setComponent(event.target.value as Component)}>{COMPONENTS.map(item => <option key={item}>{item}</option>)}</select></label><label>Units requested<select value={quantity} disabled={!!activeRequest} onChange={event => setQuantity(Number(event.target.value))}>{[1, 2, 3, 5, 10].map(item => <option key={item}>{item}</option>)}</select></label><label>Expected use<select value={hours} disabled={!!activeRequest} onChange={event => setHours(Number(event.target.value))}>{[1, 2, 6, 24, 72].map(item => <option key={item} value={item}>In {item} hour(s)</option>)}</select></label></div>
      <p className="muted text-small">Exact group first, then compatible preferences, then earliest expiry (FEFO). O-negative red cells are conserved.</p>
      <div className="lab-actions"><button className="button button-primary" disabled={match.selected.length === 0} onClick={() => operate("reserve")}>Reserve selected</button><button className="button button-secondary" disabled={!reserved} onClick={() => operate("issue")}>Issue reserved</button><button className="button button-secondary" disabled={!reserved} onClick={() => operate("cancel")}>Cancel reservations</button></div>
      {component === "FFP" && <p className="notice">&quot;Issue reserved&quot; confirms FFP preparation in this illustration. No clinical process is modelled.</p>}
      <p className="lab-result" role="status">{message}</p>{error && <p role="alert" className="error-text">{error}</p>}
      <div className="stock-metrics"><span><strong>{match.candidates.length}</strong> eligible now</span><span><strong>{request.allocatedQuantity}</strong> / {request.quantity} allocated</span><span><strong>{match.shortage}</strong> still needed</span><span><strong>{units.filter(unit => unit.status === "ISSUED").length}</strong> issued</span></div>
    </section>
    <section className="panel lab-panel" aria-labelledby="stock-heading"><div className="lab-section-heading"><div><p className="eyebrow">UNIT REGISTER</p><h2 id="stock-heading">Stock & eligibility explanations</h2></div><span className="small-label">ALL TIMES UTC</span></div>
      <div className="lab-controls"><label>Find unit<input value={query} placeholder="DEMO-002" onChange={event => setQuery(event.target.value)} /></label><label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="ALL">All statuses</option>{STATUSES.map(item => <option key={item}>{item}</option>)}</select></label><label>Bank<select value={bank} onChange={event => setBank(event.target.value)}><option value="ALL">All banks</option>{fixtureBanks.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
      <p className="muted text-small">{visible.length} of {units.length} units shown.</p>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Unit ID</th><th>Group</th><th>Component</th><th>Status</th><th>Bank</th><th>Expires</th><th>Match explanation</th></tr></thead><tbody>{visible.map(({ unit, explanation }) => <tr key={unit.id} className={match.selected.some(s => s.id === unit.id) ? "selected-row" : ""}><td className="workflow-identifier">{unit.id}</td><td><span className="status-badge status-critical">{unit.group}</span></td><td>{unit.component}</td><td>{unit.status}</td><td>{unit.bankId}</td><td>{unit.expiresAt.slice(0, 10)}</td><td className="decision-detail">{explanation}</td></tr>)}</tbody></table></div>
      {history.length > 0 && <><p className="eyebrow" style={{ marginTop: 20 }}>Activity log</p><ol className="event-list">{history.map((entry, i) => <li key={i}>{entry}</li>)}</ol></>}
    </section>
  </>;
}
