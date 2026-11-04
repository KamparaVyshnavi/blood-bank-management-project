# Operational data integration

## Source of truth

The operational server data layer (`src/lib/ops-data.ts`) is server-only. It reads through the existing `Registry` class and MongoDB connection rather than maintaining browser-side sample arrays or calling its own Next.js API routes over HTTP. This keeps Clerk identity, live membership checks, tenant filters, and the existing database authorization boundary in one place.

List reads follow the registry cursor and are bounded to 10,000 records. Bank-scoped emergency reads are derived only from that bank's authorized allocation records and then matched to requests by state, hospital ID, and hospital tenant ID. Allocation rows are first authorized through `Registry`, then re-read server-side with the actor's tenant filter so internal tenant IDs never appear in API projections. Large bank request result sets fail closed instead of silently presenting a partial list.

## Vocabulary adapters

- `PRBC` -> `Red cells`
- `PLATELETS` -> `Platelets`
- `FFP` -> `Plasma`
- Whole blood is not offered because the domain model does not support it.
- All ten persisted unit lifecycle statuses are represented in the UI; quarantine and transfusion states are not collapsed into `Issued`.
- Request statuses are mapped from the persisted request status and workflow status: `PARTIAL` is **Partially allocated**, `ALLOCATED` is **Allocated**, and `COMPLETED` is **Fulfilled**. Workflow trace timestamps are used for completion-day reporting only when a persisted `COMPLETED` trace event exists. Unsupported values fail closed rather than being guessed as `Rejected`.
- Urgency maps `ROUTINE` / `URGENT` / `CRITICAL` to `Normal` / `High` / `Critical`.

## Institution fields

The registry stores institution ID, name, district, location, tenant and state scope. It does not store registration numbers, contact details, administrators, approval status, or last activity. The operational UI therefore labels those values as not recorded and does not expose approve/suspend controls that cannot persist.

## Donor privacy

The donor directory is state-admin-only and displays nickname, blood group, eligibility date, alert-audience setting, and aggregate alert counts. It does not return real names, phone numbers, GeoJSON coordinates, session hashes, birth dates, weight, haemoglobin, or deferral reasons.

## Screen scope

- State admin: state-scoped inventory, requests, institutions, and anonymous donor directory.
- Blood bank: own inventory and requests connected to its allocation records; own institution profile.
- Hospital: own emergency requests and the public institution directory allowed by `matching/banks`; no unit-level inventory access.
- Donor: no operational registry directory access.

## Read-only boundaries

Inventory lifecycle actions are not presented as successful local-only mutations. The inventory table is read-only in this adapter phase. Emergency creation is submitted to the existing durable `/api/emergencies` endpoint only for hospital principals, using a stable idempotency key across uncertain acknowledgement retries. Emergency detail shows persisted workflow traces and allocation records; it does not locally mutate request state.

## Regression coverage

`tests/unit/ops-data.test.ts` covers backend component mapping, all unit lifecycle states, request status/urgency mapping, persisted emergency trace mapping, date-aware availability counts, and donor PII exclusion.

## Administrative boundaries

The administration screen now reports the actual integration boundary instead of rendering sample users, pretend enable/disable controls, approval queues, or a fabricated user-action audit. Clerk remains the account and role source; the current registry does not contain an institution approval state or user click-audit collection. Those unsupported controls are not presented as persistent operations.
