import Link from "next/link";

export const metadata = { title: "Operational Scenarios" };

const scenes = [
  { href: "/labs/inventory", title: "Explain a safe match", steps: "Keep A+ PRBC, quantity 2 and use in 2 hours. Inspect why expired and unscreened stock is excluded. Reserve, cancel, reserve again, then issue.", reset: "Reset fixture restores this page's sample units." },
  { href: "/match-lab", title: "Reverse the plasma rule", steps: "Select A+ to O− in PRBC: rejected. Switch to FFP and inspect the explanation. Platelets use an identical-group rule. Enable the isolated Bombay example to discuss eight-group boundaries.", reset: "Reload restores the initial selection." },
  { href: "/code-red", title: "Emergency coordination workflow", steps: "Simulate emergency request intake, dispatch reserved stock, advance simulated time, confirm handover, and verify transfusion record.", reset: "Reset journey." },
  { href: "/duel", title: "Concurrency and atomic claims", steps: "Inspect single ownership and zero double allocations under concurrent hospital demand.", reset: "Reset restores the isolated browser fixture." },
  { href: "/unit-passport", title: "Cryptographic provenance", steps: "Verify SHA-256 evidence chain and tamper detection across lifecycle milestones.", reset: "Reset fixture." },
  { href: "/waste-lab", title: "Policy evaluation and forecasting", steps: "Run 30-day policy comparison with rebalancing and inventory projections.", reset: "Cancel running comparison, or reload for defaults." },
  { href: "/cold-room", title: "Cold-chain telemetry and quarantine", steps: "Inspect component storage temperatures, simulate sensor breach, and verify automatic quarantine.", reset: "Reset local fixture." },
  { href: "/camp-planner", title: "Donation camp turnout planning", steps: "Inspect regional turnout scoring, eligible donor clusters, and radius configuration.", reset: "Reload for defaults." },
  { href: "/intelligence", title: "Multilingual emergency intake", steps: "Test natural language emergency text parsing across English, Hindi, and Hinglish.", reset: "Reload clears the draft." }
];

export default function TryPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EXPLORE / WORKFLOWS</p>
          <h1>Operational Scenarios</h1>
          <p className="page-description">Interactive workflow sandboxes and policy demonstration scenarios.</p>
        </div>
      </div>
      <section className="panel lab-panel">
        <h2>Interactive Workflows</h2>
        <p>The scenarios below run in the browser to model core blood bank and emergency coordination capabilities.</p>
      </section>
      <div className="extras-grid">
        {scenes.map(scene => (
          <section className="panel lab-panel" key={scene.href}>
            <h2><Link href={scene.href}>{scene.title}</Link></h2>
            <p>{scene.steps}</p>
            <p className="source-note"><strong>Reset: </strong>{scene.reset}</p>
          </section>
        ))}
      </div>
      <section className="panel lab-panel">
        <h2>Public &amp; Authenticated Interfaces</h2>
        <p><Link href="/public-board">Public Board</Link> exposes privacy-preserving availability bands. <Link href="/bank">Blood Banks</Link>, <Link href="/hospital">Hospitals</Link>, and <Link href="/registry">Reports &amp; Analytics</Link> enforce authenticated role-based access.</p>
      </section>
    </>
  );
}
