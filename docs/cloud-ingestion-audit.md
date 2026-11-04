# Cloud ingestion and reliability audit

This audit preserves the existing Next.js/Vercel, Inngest, and MongoDB Atlas architecture. It does not add a queue, database, service, or product workflow.

## Existing ingestion path

1. `src/server/emergency-api.ts` authenticates the Hospital principal, validates the bounded JSON body and deadline, derives a stable request ID, and sends `pulsegrid/emergency.created` to Inngest before touching Atlas.
2. HTTP 202 is returned only after Inngest acknowledges the event with nonempty event IDs. The response is `ACKNOWLEDGED_PENDING`; it is not a claim that Atlas persistence or fulfilment has completed. The signed receipt permits the same Hospital to inspect acknowledged-but-not-yet-persisted intake.
3. `/api/inngest` is served by the Inngest Next.js adapter on the Node runtime. The adapter handles signed provider callbacks; the route is not a public application event-ingress API.
4. `emergencyWorkflow` validates the event again, checks live Hospital membership, and idempotently persists the request. Durable steps orchestrate stock search, reservation, donor waves, dispatch, waits, and closure.
5. `emergencySignals` persists signals before reconciling them. Database mutations use the existing operation receipts and MongoDB transactions. A wake event prompts the workflow to re-read authoritative Atlas state.
6. The browser reads the existing status API. Acknowledged, pending, applied, rejected, failed, and fulfilled states must not be conflated.

## Corrections in this audit

- Reduced the orchestration wake budget from 330 to 190 rounds. A worst-case round can consume five durable steps: reconcile, reserve, donor wave, donor-push `sendEvent`, and wait. With two setup steps and two exhaustion steps, the maximum is 954 steps, leaving headroom below the Inngest 1,000-step limit. The previous three-step assumption omitted the donor-push send and reserve step in a wave round.
- Added regression coverage that exercises the five-step worst case, including donor-push event publication, and asserts the exact upper-bound count.
- Made worker-side event timestamps canonical ISO instants. Malformed `acceptedAt` and `receivedAt` values are rejected before persistence rather than creating invalid BSON dates or repeated transient failures.
- Hardened worker principal parsing so malformed actor payloads become permanent event-validation errors rather than uncaught type errors.
- Added a post-upsert integrity check for `workflowSignals`. A pre-existing idempotency key with a mismatched request, state, tenant, kind, or fingerprint now fails closed instead of being silently treated as the same event.
- Changed valid `stock.ready` signals to `APPLIED`. This signal is a validated wake-up, not a stock mutation; recording it as `REJECTED / NO_STATE_CHANGE` was misleading even though the workflow was correctly woken.
- Converted permanent `RegistryError` failures in the signal worker to Inngest `NonRetriableError`. Invalid or unauthorized event data no longer consumes all eight transient retries; Atlas/provider failures remain retriable.
- Aligned signal-send acknowledgement handling with emergency creation: provider exceptions and malformed/empty acknowledgement IDs now return `SIGNAL_ACKNOWLEDGEMENT_UNKNOWN`, `accepted: false`, the deterministic `signalId`, and `retrySamePayload: true`. Added regression tests proving a retry regenerates the same event ID.
- Added an exhausted-signal recovery attempt: the Inngest failure handler re-upserts the original event into the durable `workflowSignals` inbox if Atlas has recovered, then records the existing failure alert. The write is idempotent; permanent invalid payloads are not reintroduced. If Atlas remains unavailable, the Inngest failed run remains the operator replay evidence.
- Made exhausted orchestration failure update both `requests.status` and `requests.workflow.status` to `FAILED`, and made `FAILED` terminal in request parsing, dispatch, reservation, and cancellation checks. This prevents a failed workflow from appearing open or being dispatched after retries are exhausted.

## Persistence and idempotency boundaries

- Emergency request IDs are deterministic from the Hospital identity and validated input. The event ID is stable across same-payload retries.
- Workflow request persistence uses `$setOnInsert` and checks the stored fingerprint after an upsert.
- Signal IDs are deterministic from request, actor, kind, and validated input. `workflowSignals` is the durable inbox; duplicate delivery does not overwrite the first received timestamp or reset an applied/rejected status.
- Signal reconciliation rechecks live role, tenant, institution, donor/alert relationship, unit ownership, allocation ID, and lease before applying side effects.
- Reservation, dispatch, handover, use, and cancellation rely on existing transactional operation receipts and unit ownership records. Do not bypass those paths with direct writes.
- A signal can be acknowledged before it is applied. The existing `workflowSignals` status and request workflow trace are the authoritative processing result.

## Cloud deployment configuration to verify

The repository's deployment configuration already specifies:

- Node.js 24 (`.nvmrc` and `package.json` engine).
- Vercel Next.js framework, Mumbai region (`bom1`), `npm ci`, and `npm run build` (`vercel.json`).
- Node runtime and a 60-second route maximum for `/api/inngest` (`src/app/api/inngest/route.ts`).
- CI runs lint, typecheck, unit tests, integration tests, workflow tests, offline submission build, production build, cache tests, and Playwright E2E tests (`.github/workflows/ci.yml`).

For each Vercel environment, verify that `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, and a stable `WORKFLOW_RECEIPT_SECRET` of at least 32 characters are configured as server-only runtime variables. Keep `INNGEST_DEV=0` on Vercel. Use a distinct MongoDB database and credentials for each environment. Verify Atlas replica-set/transaction support, database-user least privilege, network access, and region alignment with Vercel `bom1`. Do not copy production secrets into preview or local environments.

The Inngest dashboard must show the deployed function set and successful environment sync. A successful Vercel build alone does not prove that the Inngest callback URL is registered, signed callbacks pass verification, or event delivery reaches Atlas.

## Verification status and limitations

The regression tests added in this audit are:

- `tests/unit/workflow-budget.test.ts`: five-step worst-case workflow budget including donor-push publication.
- `tests/integration/workflows.test.ts`: malformed signal timestamps, signal idempotency conflict, valid stock-ready application, terminal failed-workflow behavior, uncertain signal acknowledgement/retry, and malformed provider acknowledgement handling.

This working environment has Node 22, while the project requires Node 24, and the project dependencies are not installed here. Therefore the full Vitest, typecheck, lint, production build, local Inngest CLI, MongoDB replica-set, and Playwright runs have not been executed in this audit session. No live Vercel, Inngest Cloud, or MongoDB Atlas credentials were available. Do not interpret source-level changes or syntax checks as production cloud verification.

Run the repository's CI checks under Node 24, then run `npm run test:integration`, `npm run test:workflow`, and `npm run test:e2e`. Before a production sign-off, exercise the deployed signed Inngest callback with synthetic Hospital/Bank/Donor accounts and verify the matching Atlas request, signal, allocation, unit-event, and operation records. Retain request IDs, event IDs, Inngest run IDs, and sanitized failure/retry evidence.
