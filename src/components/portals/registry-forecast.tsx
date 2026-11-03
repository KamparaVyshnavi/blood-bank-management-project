"use client";
import { useState } from "react";
import type { ForecastJobResult } from "@/server/forecast-jobs";

export function RegistryForecast() {
  const [result, setResult] = useState<ForecastJobResult | null>(null), [message, setMessage] = useState(""), [loading, setLoading] = useState(false);
  return <section className="panel feature-panel registry-panel"><h2>Scheduled forecast proposals</h2><p>Demand forecast analysis. Transfer proposals require verified stock availability checks prior to execution.</p><button className="button button-secondary" disabled={loading} onClick={async () => {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/registry/state/forecast", { cache: "no-store", signal: AbortSignal.timeout(10000) }), data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data.forecast); if (!data.forecast) setMessage("No retained scheduled forecast. Run the Inngest workflow or enable the daily scheduled run.");
    } catch (error) { setResult(null); setMessage(error instanceof Error ? error.message : "Forecast unavailable"); }
    finally { setLoading(false); }
  }}>Refresh scheduled forecast</button><p role="status">{loading ? "Loading authorized forecast…" : message}</p>{result && <><p>IST day {result.day} · history cutoff {result.cutoff} · {result.measured.banks} banks · {result.plannedTransfers.length} planned transfers · {result.measured.resultBytes.toLocaleString()} BSON bytes</p><p>{result.weather.filter(row => row.scope === "BANK" && row.weather === "STORM").length} bank/group/component storm warnings; {result.weather.filter(row => row.scope === "BANK" && row.weather === "UNKNOWN").length} lack sufficient history.</p><p className="source-note">{result.limitations}</p><details><summary>Inspect authorized proposal JSON</summary><pre style={{ overflow: "auto", maxHeight: 400 }}>{JSON.stringify(result, null, 2)}</pre></details></>}</section>;
}
