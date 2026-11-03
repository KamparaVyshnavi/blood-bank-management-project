"use client";
import { useEffect, useState } from "react";
import { StatusBadge } from "../ui/status-badge";

type State = { tone: "healthy" | "low" | "critical" | "neutral"; text: string };
/** Reflects the real /api/health response. It never shows green unless the request succeeded. */
export function useHealth(): State & { detail?: Record<string, unknown> } {
  const [s, setS] = useState<State & { detail?: Record<string, unknown> }>({ tone: "neutral", text: "Checking…" });
  useEffect(() => {
    let live = true;
    const check = () => fetch("/api/health", { cache: "no-store" }).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then(d => { if (live) setS(d.status === "ok" ? { tone: "healthy", text: "App running", detail: d } : { tone: "low", text: "Degraded", detail: d }); }).catch(() => { if (live) setS({ tone: "critical", text: "App unreachable" }); });
    check(); const t = setInterval(check, 60000);
    return () => { live = false; clearInterval(t); };
  }, []);
  return s;
}
export function HealthIndicator() { const h = useHealth(); return <StatusBadge tone={h.tone}>{h.text}</StatusBadge>; }

export default HealthIndicator;
