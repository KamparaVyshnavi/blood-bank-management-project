# End-to-end workflow audit

## Scope

This audit preserves the existing Next.js, Clerk, MongoDB, and Inngest architecture. It does not add product capabilities. The role matrix is based on the existing server authorization model and synthetic integration fixtures; it is not a live production-account test.

## Role coverage

| Role | Existing workflow exercised/reviewed | Expected boundary |
|---|---|---|
| State Admin | State registry reads, cross-institution administrative reads, state-scoped data | May inspect records within the configured state; cannot cross state boundaries |
| Bank A | Own bank profile, units, stock, collection, screening, storage, lifecycle and allocation ownership | Cannot read or mutate Bank B or hospital-owned records |
| Bank B | Same bank workflow under a distinct tenant | Cannot access Bank A's records or allocations |
| Hospital A | Own requests, matching directory, reservation, allocation history, handover/transfusion, cancellation | May access state-wide bank directory but not another hospital's requests or allocations |
| Hospital B | Same hospital workflow under a distinct tenant | Cannot access Hospital A's records or reservations |
| Donor | Registration, own alerts, reply, push subscription, opt-out and deletion | Session-bound access only; cannot read another donor's alerts or unrelated request data |

## Corrections in this audit

### Hospital cancellation

Cancellation previously selected units using only `stateId` and `reservation.requestId`. It now resolves active/issued allocations using the authenticated hospital tenant and hospital ID, then loads each unit using the allocation's bank tenant, bank ID, request ID, and allocation ID. It rejects inconsistent ownership rather than operating on an ambiguous unit.

Releasing a reservation updates the request's allocated counter and can change its status. Cancellation now re-reads the request inside the same transaction and performs a compare-and-set update against the current status and counters. This avoids matching a stale pre-release status and preserves atomic rollback on conflicts.

### Donor alert relationships

New donor alerts now retain `requestTenantId`, `hospitalId`, and `collectionBankTenantId` in addition to the donor tenant. These fields are optional in the MongoDB validator to avoid making existing records fail schema validation. New read/reply/push/status paths require the request and institution relationship to match. Legacy alerts without authoritative linkage are not used to disclose request details or count toward a tenant's workflow.

A compound index supports state/request-tenant/request/status lookups.

## Existing test coverage reviewed

- `tests/integration/registry.test.ts`: Clerk identity, malformed metadata, membership revocation, state boundaries, Bank A/B and Hospital A/B tenant isolation, donor self-access, state-admin scope, and API input validation.
- `tests/integration/reservations.test.ts`: bank/hospital mutation authorization, reservation ownership, counters, cancellation, unique allocation slots, and cross-hospital isolation.
- `tests/integration/donor.test.ts`: donor session lifecycle, alert ownership, replies, expiry, opt-out, deletion, push delivery, and workflow status disclosure.
- `tests/e2e/portal-workflows.spec.ts`: existing bank and hospital frontend workflow components against synthetic API responses, including retry-key behavior.
- `tests/e2e/registry.spec.ts`: unauthenticated API denial and safe rendering of bank, hospital, donor, registry, and sign-in screens.

New regression coverage was added for cancellation under colliding cross-tenant request references and for donor alert/request tenant-link mismatch.

## Validation limitations

The environment has Node 22, while `.nvmrc` and `package.json` require Node 24. The repository has no installed `node_modules`; `npm ci --ignore-scripts --no-audit --no-fund` did not complete within the available execution window. Therefore Vitest, Playwright, ESLint, TypeScript project typechecking, and the production build were not executed in this environment.

The eight modified TypeScript source/test files passed TypeScript `transpileModule` syntax diagnostics. This is a syntax check only, not a substitute for typechecking or running MongoDB replica-set tests.

Live Clerk users, production MongoDB, and Inngest credentials were not supplied, so no live-account or production-data test was performed. Use the synthetic test fixtures and then run the full checks in the project's Node 24 environment before deployment.
