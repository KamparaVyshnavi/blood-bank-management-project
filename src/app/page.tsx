"use client";

import { useEffect, useState } from "react";
import type { AvailabilityBand } from "@/core/public-board";

type Cell = {
  district: string;
  group: string;
  component: string;
  band: AvailabilityBand;
};

type PublicBoardData = {
  schema: number;
  generatedAt: string;
  source: string;
  cells: Cell[];
};

type SummaryCard = {
  title: string;
  value: string | number;
  sub: string;
  iconClass: string;
  icon: string;
};

function bandColor(band: AvailabilityBand) {
  switch (band) {
    case "HIGH": return "pg-badge-green";
    case "MODERATE": return "pg-badge-teal";
    case "LOW": return "pg-badge-amber";
    case "NONE": return "pg-badge-red";
    default: return "pg-badge-gray";
  }
}

function MetricCard({ card }: { card: SummaryCard }) {
  return (
    <div className="pg-card">
      <div className="pg-card-header">
        <span className="pg-card-title">{card.title}</span>
        <span className={`pg-card-icon ${card.iconClass}`}>{card.icon}</span>
      </div>
      <div className="pg-card-value">{card.value}</div>
      <div className="pg-card-sub">{card.sub}</div>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="pg-grid-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="pg-card">
          <div className="pg-card-header">
            <div className="skeleton" style={{ width: 100, height: 12 }} />
          </div>
          <div className="skeleton" style={{ width: 60, height: 28, margin: "8px 0" }} />
          <div className="skeleton short" style={{ width: 120, height: 12 }} />
        </div>
      ))}
    </div>
  );
}

export default function OverviewPage() {
  const [board, setBoard] = useState<PublicBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public-board")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: PublicBoardData | { error: string }) => {
        if ("error" in data) setError(String(data.error));
        else setBoard(data);
      })
      .catch(() => setError("Unable to load inventory data."))
      .finally(() => setLoading(false));
  }, []);

  // Compute summary from the public board cells
  const availableCells = board?.cells.filter(c => c.band !== "NONE") ?? [];
  const noneCells = board?.cells.filter(c => c.band === "NONE") ?? [];
  const lowCells = board?.cells.filter(c => c.band === "LOW") ?? [];
  const districts = board ? [...new Set(board.cells.map(c => c.district))] : [];
  const groups = board ? [...new Set(board.cells.map(c => c.group))] : [];

  const cards: SummaryCard[] = [
    {
      title: "Stock Coverage",
      value: loading ? "—" : board ? `${availableCells.length} / ${board.cells.length}` : "Unavailable",
      sub: "Group-component-district combinations with stock",
      iconClass: "pg-icon-teal",
      icon: "🩸",
    },
    {
      title: "Blood Groups Tracked",
      value: loading ? "—" : groups.length || "Unavailable",
      sub: `Across ${districts.length} districts`,
      iconClass: "pg-icon-blue",
      icon: "◎",
    },
    {
      title: "Attention Required",
      value: loading ? "—" : `${noneCells.length + lowCells.length}`,
      sub: `${noneCells.length} out of stock · ${lowCells.length} low`,
      iconClass: noneCells.length > 0 ? "pg-icon-red" : lowCells.length > 0 ? "pg-icon-amber" : "pg-icon-green",
      icon: noneCells.length > 0 ? "⚠" : "✓",
    },
    {
      title: "Data Freshness",
      value: board?.generatedAt
        ? new Date(board.generatedAt).toLocaleTimeString()
        : loading ? "—" : "Unknown",
      sub: board?.generatedAt ? `Snapshot: ${new Date(board.generatedAt).toLocaleDateString()}` : "Inventory snapshot age",
      iconClass: error ? "pg-icon-red" : "pg-icon-green",
      icon: error ? "⚠" : "✓",
    },
  ];

  // Aggregate: group → { component → { band → districts[] } }
  const grouped = new Map<string, Map<string, { band: AvailabilityBand; districts: string[] }[]>>();
  if (board) {
    for (const cell of board.cells) {
      if (!grouped.has(cell.group)) grouped.set(cell.group, new Map());
      const compMap = grouped.get(cell.group)!;
      if (!compMap.has(cell.component)) compMap.set(cell.component, []);
      compMap.get(cell.component)!.push({ band: cell.band, districts: [cell.district] });
    }
  }

  return (
    <div className="pg-overview">
      <h1>Overview</h1>
      <p className="pg-subtitle">
        Blood Bank Management &amp; Emergency Coordination — operational summary
      </p>

      {loading ? (
        <LoadingCards />
      ) : (
        <div className="pg-grid-4">
          {cards.map(card => (
            <MetricCard key={card.title} card={card} />
          ))}
        </div>
      )}

      {error && (
        <div className="pg-alert-banner pg-alert-warning">
          ⚠ Inventory data is currently unavailable. The platform may be starting up or the database connection is being established.
        </div>
      )}

      {board && !error && board.cells.length > 0 && (
        <div className="pg-section">
          <p className="pg-section-title">Blood Availability by Group</p>
          <div className="pg-card">
            <div style={{ overflowX: "auto" }}>
              <table className="pg-table">
                <thead>
                  <tr>
                    <th>Blood Group</th>
                    <th>Component</th>
                    <th>District</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {board.cells.map(cell => (
                    <tr key={`${cell.group}-${cell.component}-${cell.district}`}>
                      <td><span className="pg-badge pg-badge-red">{cell.group}</span></td>
                      <td>{cell.component.replace(/_/g, " ")}</td>
                      <td>{cell.district}</td>
                      <td><span className={`pg-badge ${bandColor(cell.band)}`}>{cell.band}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: "var(--pg-muted-dark)", padding: "12px 14px 4px", margin: 0 }}>
              Availability bands (None / Low / Moderate / High) are derived from actual inventory counts but do not disclose exact unit numbers for privacy.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && (!board || board.cells.length === 0) && (
        <div className="pg-card">
          <div className="pg-empty">
            <div className="pg-empty-icon">🩸</div>
            <h3>No inventory data available</h3>
            <p>Blood inventory data will appear here once the database is connected and seeded.</p>
          </div>
        </div>
      )}

      <div className="pg-section">
        <p className="pg-section-title">Quick Actions</p>
        <div className="pg-grid-3">
          <a href="/code-red" className="pg-card" style={{ textDecoration: "none", display: "block" }}>
            <div className="pg-card-header">
              <span className="pg-card-title">Emergency Coordination</span>
              <span className="pg-card-icon pg-icon-red">ϟ</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--pg-muted-dark)", margin: 0 }}>Submit or track urgent blood requests.</p>
          </a>
          <a href="/inventory" className="pg-card" style={{ textDecoration: "none", display: "block" }}>
            <div className="pg-card-header">
              <span className="pg-card-title">Blood Inventory</span>
              <span className="pg-card-icon pg-icon-teal">▤</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--pg-muted-dark)", margin: 0 }}>View and manage blood stock across registered banks.</p>
          </a>
          <a href="/donor" className="pg-card" style={{ textDecoration: "none", display: "block" }}>
            <div className="pg-card-header">
              <span className="pg-card-title">Donor Management</span>
              <span className="pg-card-icon pg-icon-blue">♡</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--pg-muted-dark)", margin: 0 }}>Manage donor records, eligibility and alert subscriptions.</p>
          </a>
        </div>
      </div>
    </div>
  );
}
