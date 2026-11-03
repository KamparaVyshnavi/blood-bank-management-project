"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusBadge } from "./ui/status-badge";

const nav = [
  {
    label: "Main",
    links: [
      { href: "/", label: "Overview", icon: "⌁" },
      { href: "/inventory", label: "Blood Inventory", icon: "▤" },
      { href: "/code-red", label: "Emergency Coordination", icon: "ϟ" },
      { href: "/bank", label: "Blood Banks", icon: "⊞" },
      { href: "/hospital", label: "Hospitals", icon: "＋" },
      { href: "/donor", label: "Donor Management", icon: "♡" },
      { href: "/registry", label: "Reports & Analytics", icon: "▦" },
    ],
  },
  {
    label: "Administration",
    links: [
      { href: "/vital-signs", label: "System Health", icon: "⚙" },
      { href: "/public-board", label: "Public Board", icon: "◎" },
    ],
  },
  {
    label: "Labs",
    links: [
      { href: "/waste-lab", label: "Waste Analysis", icon: "☂" },
      { href: "/surge-lab", label: "Surge Planning", icon: "~" },
      { href: "/match-lab", label: "Match Lab", icon: "⌘" },
      { href: "/unit-passport", label: "Unit Passport", icon: "#" },
      { href: "/camp-planner", label: "Camp Planner", icon: "+" },
      { href: "/cold-room", label: "Cold Chain", icon: "*" },
      { href: "/intelligence", label: "Intelligence", icon: "i" },
      { href: "/duel", label: "Concurrency Lab", icon: "⇄" },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/inventory": "Blood Inventory",
  "/code-red": "Emergency Coordination",
  "/bank": "Blood Banks",
  "/hospital": "Hospitals",
  "/donor": "Donor Management",
  "/registry": "Reports & Analytics",
  "/vital-signs": "System Health",
  "/public-board": "Public Board",
  "/waste-lab": "Waste Analysis",
  "/surge-lab": "Surge Planning",
  "/match-lab": "Match Lab",
  "/unit-passport": "Unit Passport",
  "/camp-planner": "Camp Planner",
  "/cold-room": "Cold Chain",
  "/intelligence": "Intelligence",
  "/system": "System",
  "/duel": "Concurrency Lab",
  "/try": "Getting Started",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "PulseGrid";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="PulseGrid home">
          <span className="brand-symbol" aria-hidden="true">P<span>+</span></span>
          <span>PulseGrid<small>BLOOD BANK MGMT</small></span>
        </Link>
        <div className="sidebar-divider" />
        <nav aria-label="Main navigation">
          {nav.map(group => (
            <div className="nav-group" key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.links.map(link => (
                <Link
                  key={link.href}
                  className={`nav-link ${pathname === link.href ? "active" : ""}`}
                  href={link.href}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">{link.icon}</span>
                  {link.label}
                  {pathname === link.href && <span className="nav-active-dot" aria-hidden="true" />}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/system" className={`nav-link ${pathname === "/system" ? "active" : ""}`} aria-current={pathname === "/system" ? "page" : undefined}>
            <span className="nav-icon" aria-hidden="true">⚙</span>System Foundation
          </Link>
          <div className="sidebar-version">
            <span>PULSEGRID</span>
            <span className="mono">v1.0</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>PulseGrid</span>
            <span aria-hidden="true">/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-status">
            <StatusBadge tone="healthy">Platform Active</StatusBadge>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="app-footer">
          <strong>PulseGrid</strong>
          <span>Cloud-Based Blood Bank Management &amp; Emergency Coordination Platform</span>
        </footer>
      </div>
    </div>
  );
}
