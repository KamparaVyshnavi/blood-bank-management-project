import Link from "next/link";
import { PageHeader, Section } from "@/components/ds/page-header";

export const metadata = { title: "Labs" };

const groups = [
  { title: "Simulations and explainers", hint: "Teaching tools that run on generated data. They don’t change real records.", items: [
    { href: "/code-red", name: "Emergency simulator", desc: "Run an emergency from request to handover and watch each step." },
    { href: "/labs/inventory", name: "Matching lab", desc: "See why a unit is or isn’t eligible, then reserve and issue it." },
    { href: "/match-lab", name: "Compatibility rules", desc: "Check donor and recipient compatibility for each component." },
    { href: "/duel", name: "Concurrency test", desc: "Two hospitals ask for one unit; only one gets it." },
    { href: "/unit-passport", name: "Unit passport", desc: "Verify the tamper-evident history of a unit." },
    { href: "/waste-lab", name: "Wastage forecast", desc: "Compare stock policies over 30 simulated days." },
    { href: "/surge-lab", name: "Surge planning", desc: "Test how stock holds up under a spike in demand." },
    { href: "/camp-planner", name: "Donation camp planner", desc: "Rank locations for the next donation camp." },
    { href: "/cold-room", name: "Cold room", desc: "Storage temperatures and automatic quarantine." },
    { href: "/intelligence", name: "Request text reader", desc: "Turn typed requests in English, Hindi or Hinglish into a structured request." },
  ] },
  { title: "Sign-in portals and public pages", hint: "Pages that depend on authentication or serve the public.", items: [
    { href: "/bank", name: "Blood bank portal", desc: "Stock and issue workflow for a signed-in bank." },
    { href: "/hospital", name: "Hospital portal", desc: "Requests and handover for a signed-in hospital." },
    { href: "/donor", name: "Donor app", desc: "Mobile-first alerts for donors." },
    { href: "/registry", name: "Registry reports", desc: "Registry-level forecasts and checks." },
    { href: "/public-board", name: "Public availability board", desc: "District-level availability without exact numbers." },
    { href: "/vital-signs", name: "Service status", desc: "Technical status of platform services." },
    { href: "/system", name: "System foundation", desc: "Build and configuration details." },
  ] },
];

export default function LabsPage() {
  return (
    <div className="ds-page">
      <PageHeader title="Labs" description="Simulations, explainers and technical tools. Day-to-day work happens in the main navigation." />
      {groups.map(g => (
        <Section key={g.title} title={g.title} hint={g.hint}>
          <ul className="ds-linklist">{g.items.map(i => <li key={i.href}><Link href={i.href}><strong>{i.name}</strong><span>{i.desc}</span></Link></li>)}</ul>
        </Section>
      ))}
    </div>
  );
}
