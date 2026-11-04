import "server-only";

/** Application liveness only. Does not probe or reveal provider configuration. */
export function getScaffoldHealth() {
  return {
    app: "blood-bank-management-system",
    status: "ok",
    stage: "registry-foundation",
    runtime: "nodejs",
    node: process.versions.node,
    region: process.env.VERCEL_REGION || "not-reported",
    integrations: { atlas: "not-probed", clerk: "not-probed", inngest: "not-probed" }
  } as const;
}
