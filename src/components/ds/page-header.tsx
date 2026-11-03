import Link from "next/link";
import { Icon } from "./icons";

export function PageHeader({ title, description, back, children }: { title: string; description?: string; back?: { href: string; label: string }; children?: React.ReactNode }) {
  return (
    <header className="ds-page-header">
      <div>
        {back && <Link href={back.href} className="ds-back"><Icon name="back" size={14} />{back.label}</Link>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="ds-page-actions">{children}</div>}
    </header>
  );
}

export function Section({ title, hint, action, children, flush }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode; flush?: boolean }) {
  return (
    <section className="ds-section">
      <div className="ds-section-head"><div><h2>{title}</h2>{hint && <p>{hint}</p>}</div>{action}</div>
      <div className={flush ? "ds-card ds-card-flush" : "ds-card"}>{children}</div>
    </section>
  );
}
