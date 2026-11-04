import { it, expect } from "vitest";
import { orchestrate } from "../../src/inngest/orchestrate";
import type { WorkflowStore } from "../../src/server/workflow-store";
import type { CreatedData } from "../../src/inngest/events";

it("an endless stream of wakes escalates below the platform's 1,000-step ceiling", async () => {
  let steps = 0, closed = false;
  const snapshot = { status: "AWAITING_DONORS", quantity: 2, allocated: 1, transfused: 0, issued: 0, handedOver: 0, acceptedDonors: 0, waveCount: 0, waveDue: true, due: false, nextWakeAt: "2026-10-29T12:00:00.000Z" };
  const fixture = { initialize: async () => ({}), note: async () => {}, reconcile: async () => ({}), maintain: async () => {}, snapshot: async () => snapshot, reserve: async () => ({ reserved: 0 }), wave: async () => ({ index: 0 }), dispatch: async () => ({ dispatched: false }), close: async () => { closed = true; return { status: "ESCALATED" }; } } as unknown as WorkflowStore;
  const result = await orchestrate({ requestId: "budget-fixture" } as CreatedData, "run", "event", {
    run: async (_id, action) => { steps++; return action(); },
    wait: async () => { steps++; }, notifyWave: async () => { steps++; }, escalation: async () => { steps++; }
  }, async () => fixture);
  expect(result.status).toBe("ESCALATED"); expect(closed).toBe(true); expect(steps).toBeLessThan(1000); expect(steps).toBeGreaterThan(900); expect(steps).toBe(954);
});
