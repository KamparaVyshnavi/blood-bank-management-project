# Atlas registry and identity setup (Stages 5–6)

All registry records are synthetic. **Teaching model, not clinical software.** Browser simulation never writes to this database. The Stage 5 code is implemented and tested locally; an actual Atlas cluster, account roles/network rules, Vercel secrets and real Clerk session replay still need connected accounts. See the workspace's `_ai_context/STAGE_5_EVIDENCE.md` for the current evidence.

## Provision the dedicated environments

1. In an eligible Atlas project, create a development/demo replica-set cluster near the Vercel Node function. Prefer AWS Mumbai if offered by that account; otherwise align both services in Singapore. Verify the account's actual free-tier availability and storage before provisioning. Do not upgrade or buy static networking automatically.
2. Use distinct databases and database users: `bloodbank_dev` locally, `bloodbank_preview` on preview, and `bloodbank_prod` for the deployed environment. Runtime accepts conservative MongoDB database names containing only letters, numbers, underscores and hyphens (maximum 63 bytes); the reserved `admin`, `local` and `config` databases are rejected. Keep Development, Preview and Production databases and credentials isolated. The application dataset remains synthetic teaching data, not a clinical record system.
3. Create a temporary setup user restricted to the selected database with `readWrite` and `dbAdmin` there. These privileges support collection/schema/index management, stats and the write/abort transaction probe. Never assign `atlasAdmin`, `root`, or roles on all databases. Remove/disable the setup user after setup. The application does not create indexes or run seeds on startup.
4. Create the application's runtime user with the database-specific [Stage 6 privilege table](reservations.md#setup-and-migration). The original Stage 5 profile-only role is insufficient for reservation/lifecycle transactions. Do not grant schema/index administration, deletes or access to `_registryMeta`. Atlas custom roles can take time to propagate. The app's shared database credential does not replace per-request application tenancy checks.
5. Add the developer's actual public IP as a temporary `/32` Atlas access-list entry. Vercel Functions use dynamic outbound IPs by default; do not mistake a deployment's inbound/DNS IP for its egress IP. If account-supported static egress is already available, allowlist those exact egress IPs. Otherwise record an explicit networking decision before enabling a temporary `0.0.0.0/0` demo entry. That permits connection attempts from the Internet and requires TLS, a strong database-specific credential, and removal after the demo. This workspace has made no network-rule change.
6. Copy `.env.example` to ignored `.env.local`. Set the MongoDB SRV URI (TLS, URL-encoded password), target database, Clerk secret and publishable keys. Keep the setup user's URI only in the local shell/environment while running setup; restore the runtime URI before starting the app. Never paste secrets into chat, logs, screenshots or the report.
7. Set `REGISTRY_STATE_ID` separately in Vercel Development, Preview and Production. It defaults to `maharashtra-pilot` to preserve the existing pilot records. A different value selects a different state partition; it does not migrate or copy data. Ensure every Clerk user's `publicMetadata.registry.stateId` matches the selected deployment value. Set corresponding secrets separately in Vercel Development, Preview and Production, with isolated database users and appropriate Clerk instances. Keep `MONGODB_URI`, `MONGODB_DB_NAME`, `CLERK_SECRET_KEY`, and `CLERK_AUTHORIZED_PARTIES` server-side. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` at build time. `CLERK_AUTHORIZED_PARTIES` is an optional comma-separated list of exact trusted app origins; set it for the selected deployment origins. Redeploy after changing build-time values. Never seed during a build or request.

Record the cluster/project identifier, tier, actual region, database name, role names and allowed action list, access-list CIDRs and expiry, Vercel environment/region, and preview URL. Record names and decisions only; do not record passwords, URIs, API tokens or secret key values.

## Stage 11 audit setup

Before seeding or inventory writes, configure `AUDIT_HMAC_SECRET` as 64 random
hex characters (32 bytes), stable for this environment and server-only. See
[Unit Passport and audit](audit.md) for schema upgrades, legacy unsigned data,
runtime privileges, schedules, isolated tamper/reset and trust limits. Schema
upgrade preserves legacy data; it does not sign or repair existing records.
New unit seeds atomically record signed imported baselines. Use a separate
disposable database for deliberate direct edits.

## Seed, reset and verify

With Node 24, installed dependencies, the setup credential and an allowed database configured:

```powershell
npm run registry -- seed --confirm=bloodbank_dev --preset=development
npm run registry -- verify
# Existing Stage 5 database: preserve data while adding Stage 6 schema/indexes:
npm run registry -- upgrade --confirm=bloodbank_dev
# Destructive to the known registry collections in this confirmed demo database:
npm run registry -- reset --confirm=bloodbank_dev
# Optional reproducible clock/preset; changing either requires reset:
npm run registry -- reset --confirm=bloodbank_dev --preset=demo --at=2026-10-28T12:00:00.000Z
```

Seed uses 250-record upsert batches and a `_registryMeta` ownership marker. A fresh database must be empty before the script claims it. Repeating seed reuses the saved clock/preset and inserts missing fixtures without overwriting edits or duplicating IDs. An explicit reset rebuilds the fixture, deleting the known collections' documents after exact-name confirmation; it leaves indexes and unrelated collections intact. Reset is refused for unmarked nonempty databases, disallowed names and `VERCEL_ENV=production`. Run it with the app/workers stopped; seed/reset is an operator tool, not a concurrent or crash-atomic migration. A failed batch may leave a partial fixture; rerun seed with the same clock/preset to insert missing records.

The first seed chooses the current UTC clock so stock has meaningful expiry. The returned clock and hash make later replays reproducible. A fixed old clock deliberately produces old/expired fixtures; do not claim those are currently usable stock. The initial stock counters describe availability at the seed clock; Stage 6 adds runtime expiry/reconciliation through authenticated bank maintenance.

The JSON report contains fixture counts, deterministic hash, BSON estimate, server data/index/storage bytes, verified index definitions and a transactional insert that is aborted. An Atlas report must be retained before checking off the live setup gate. WiredTiger statistics immediately after inserts/checkpoints can lag; they are observations at the time of the command, not a steady-state capacity measurement.

For local verification with no Atlas or Clerk account:

```powershell
npm run test:integration
npm run registry:local-report
```

These download MongoDB 8.0.17 into ignored `.tools/mongodb` on first use and start/stop a temporary single-node WiredTiger replica set. Download access and local process execution are required. API tests use mocked Clerk's `auth()`/`currentUser()` responses and the real MongoDB engine. They do not prove live Clerk token verification, Atlas network access or managed-service entitlement. The local report measures both presets; audience donors add one synthetic record to each generator preset. No external cluster is contacted by these commands.

## Clerk membership

Create/configure a Clerk application and its allowed origins/redirects. Use separate development and production instances as appropriate. Visit `/sign-in` for the prebuilt login. A newly signed-up user has no registry access. An operator must assign **public metadata through the Clerk dashboard or Backend API**, under the single `registry` property:

| Role | `publicMetadata.registry` |
|---|---|
| State admin | `{"role":"STATE_ADMIN","stateId":"maharashtra-pilot"}` |
| Bank A | `{"role":"BANK","stateId":"maharashtra-pilot","tenantId":"tenant-demo-bank-1","bankId":"demo-bank-1"}` |
| Bank B | `{"role":"BANK","stateId":"maharashtra-pilot","tenantId":"tenant-demo-bank-2","bankId":"demo-bank-2"}` |
| Hospital A | `{"role":"HOSPITAL","stateId":"maharashtra-pilot","tenantId":"tenant-demo-hospital-1","hospitalId":"demo-hospital-1"}` |
| Hospital B | `{"role":"HOSPITAL","stateId":"maharashtra-pilot","tenantId":"tenant-demo-hospital-2","hospitalId":"demo-hospital-2"}` |
| Donor | `{"role":"DONOR","stateId":"maharashtra-pilot","tenantId":"tenant-demo-donor-1","donorId":"demo-donor-1"}` |
| Audience donor | `{"role":"DONOR","stateId":"maharashtra-pilot","tenantId":"tenant-audience-donor-1","donorId":"audience-donor-1"}` |

Every request verifies a Clerk session, fetches the current backend user (to avoid stale metadata claims after revocation), strictly validates the role-specific shape, and checks the referenced institution/donor and its tenant in Atlas. No organization ID, client header, `unsafeMetadata`, role dropdown or submitted tenant ID grants access. The backend user lookup consumes Clerk API quota and fails closed on outage/rate limit. There is no development login bypass. Unknown metadata fields or a different state fail closed. The active state partition is `REGISTRY_STATE_ID` (default `maharashtra-pilot` for backwards compatibility). It must be a 1–64 character identifier containing letters, numbers, underscores or hyphens. All role metadata and existing records must use the same state ID; changing this value is a partition switch, not a data migration. The administration page reads a bounded, read-only Clerk user directory (up to 500 recent accounts in the active state partition) and returns only user ID, display name, primary email, validated registry role, institution identifier, Clerk banned/locked status and last sign-in. Donor-role accounts are omitted entirely so an anonymous donor record cannot be linked to a Clerk identity from the administration screen. It never returns raw public/private metadata, phone numbers or authentication secrets. User role changes remain managed in Clerk; no MongoDB `users` collection is introduced. The sidebar reads only the Clerk `publicMetadata.registry.role` label to display role-appropriate links; it is presentation only. API authorization continues to use the fresh server-side identity and live MongoDB membership check, so a hidden or manually opened page does not grant access. While Clerk is loading or the role is missing/unknown, privileged links remain hidden.

Open the corresponding `/bank`, `/hospital`, `/donor` or `/registry` portal. These show protected registry reads and synthetic display-name mutation. Bank and Hospital also expose the [Stage 6 inventory/request/handover workflows](reservations.md). A portal for a different role shows a denied state and links to the other portals. Account changes discard fetched tenant state. Audience registration and responses remain Stage 9. Donor audience subscription writes revalidate the exact cookie hash, audience flag, state, tenant and expiry in the update predicate; workflow donor replies additionally bind alert reads and writes to the donor tenant.

## Protected API and data-access contract

All operations run on Node and pass through `Registry` for reads/profile writes or `Operations` for [Stage 6 lifecycle transactions](reservations.md#api-contract). Route handlers never build MongoDB queries. The production `server-only` imports prevent client/worker access; the test runner's shim is confined to its dedicated configuration.

| Method and path under `/api/registry/` | Authorization |
|---|---|
| `GET me` | Valid identity and live registry membership |
| `GET banks/:bankId` | Own bank or state admin |
| `GET banks/:bankId/{units,unitEvents,stock,allocations}` | Own bank or state admin; every child also matches bank ID and tenant |
| `GET hospitals/:hospitalId` | Own hospital or state admin |
| `GET hospitals/:hospitalId/{requests,allocations}` | Own hospital or state admin; child matches hospital ID and tenant |
| `GET donors/:donorId` and `donors/:donorId/alerts` | Own non-expired donor or state admin |
| `GET state/:collection` and `state/:collection/:id` | Explicit state admin capability, current state only |
| `GET matching/banks` | Explicit hospital/admin state-wide directory capability; only bank ID, name, district, GeoJSON point |
| `PATCH banks/:id` or `hospitals/:id` | Own institution/admin; strictly `{ "name": "Synthetic name" }` |
| `PATCH donors/:id` | Own non-expired donor/admin; strictly `{ "nickname": "Synthetic nickname" }` |

Child collection paths optionally end with `/:id` for a single record. Lists return at most 100 records and a stable ID cursor (`?after=<next>`). All other query fields are rejected. Projections explicitly allow public-to-that-scope fields; bank unit responses omit donor IDs. There is no generic Mongo query/mutation endpoint. Privileged unit fields cannot be changed by these APIs.

PATCH requires JSON, at most 8 KiB, an exact same-origin `Origin` header, a valid name of at most 80 characters, and no extra fields. Browser `fetch` supplies `Origin`; CLI clients must supply it explicitly. Mongo operators/ownership/role fields are rejected. Sensitive responses (including denials) use `Cache-Control: private, no-store, max-age=0` and vary on Cookie/Authorization. No provider error text or connection string reaches the response. Authorization failures use 401/403 and structured denial logs with only actor ID, role, correlation ID, fixed code and status. Missing configuration/dependency failure returns 503. No raw submitted URL, query or body is logged.

No record existence is disclosed across tenants: an inaccessible ID and a nonexistent ID both return 403. Collections and foreign keys are application-enforced; the database credential must remain server-only. Matching across the state is an explicit separate method, never an unscoped unit/donor query by a hospital.

## Authentication and authorization coverage outside the registry API

| Route family | Access boundary |
|---|---|
| `/api/emergencies/*` | Fresh Clerk identity; hospital-only intake/signals where applicable; state admin may inspect state workflows; hospital status reads are restricted to the matching hospital and tenant; signed intake receipts do not replace authentication |
| `/api/audit/*` | State admin for audit-wide verification/status; bank may inspect only its own unit passport after live bank membership verification |
| `/api/resilience/*` | State admin only |
| `/api/intelligence/intake` | Hospital only, with the hospital record rechecked in MongoDB |
| `/api/intelligence/ops` | State admin only |
| `/api/donor/*` | Short-lived opaque bearer cookie stored as a hash in MongoDB; subscription, reply, opt-out and deletion recheck the exact session and donor tenant on writes |
| `/api/inngest` | Inngest SDK signature verification; not a browser-session endpoint |
| `/api/public-board`, `/api/health`, `/api/refresh-hints` | Intentionally public, privacy-preserving aggregate/liveness/boolean-hint responses only; no private records or credentials |

The donor workflow-signal path binds donor alert authorization, reconciliation updates and replay checks to the donor's tenant as well as donor ID, request ID and state. Workflow-signal scans and status transitions are also state/request scoped. A tenant mismatch is denied rather than treated as a valid donor response.

## Collections, dates, indexes and active ownership

`banks`, `hospitals`, `units`, `unitEvents`, `requests`, `allocations`, `donors`, `stock`, `alerts` have strict required-field/BSON-type validators. Identity fields include string `_id`/`id`, state and owner tenant. Coordinates use GeoJSON `[longitude, latitude]`. Database instants are BSON Dates; HTTP JSON serializes them as UTC timestamps. Existing pure TypeScript simulation keeps its original ISO strings and coordinate representation.

Indexes include bank/hospital/donor `2dsphere`; the AVAILABLE-only `(bankId, component, group, expiresAt, _id)` FEFO index; tenant/request/timeline lookup indexes; unique `allocations.unitId`; unique `(bankId, group, component)` stock buckets; unique request/donor alert; and `donors.expireAt` TTL with `expireAfterSeconds: 0`. The index verifier compares keys, uniqueness, partial predicates and TTL values against checked-in definitions.

Allocations represent one durable ownership slot per unit. Stage 6 records release/reassignment history in `unitEvents` and atomically reuses RELEASED slots without weakening the unconditional unique index. The new `operations` collection stores transactional retry receipts; hospital history and lease-expiry indexes support its workflows. Stage 11 adds ordered cryptographic audit events and `anchors`; no hash-chain integrity claim is made now.

Audience donors require `audience: true` and a BSON Date `expireAt` (seed is 24 hours after the seed clock). Permanent synthetic fixtures require `audience: false` and no expiry. Authorization and every donor read enforce `expireAt > now`; equality means expired. TTL is asynchronous storage cleanup and never an access-control mechanism.

## Live acceptance replay still required

Use separate browser profiles for Bank A and Bank B. Verify each sees only its own units; change A's synthetic name, reload and verify it persists. With A's authenticated session, fetch Bank B's profile, units and PATCH profile: all must return 403, generate a denial log/correlation ID, and leave B unchanged. Try a valid A profile update carrying `tenantId`, `bankId`, `role` or `status`: expect 400. Repeat cross-hospital checks. As admin, verify state-scoped reads. As donor, verify self-only access and immediate expiry before TTL deletion. Revoke membership in Clerk and confirm the next API request is denied without waiting for token refresh.

Retain sanitized seed/verify reports, browser screenshots, HTTP status/cache headers, denial log IDs, exact preview URL and a named reviewer. A successful `/api/health` is liveness only and reports providers `not-probed`; it proves no managed-service connectivity.

## Official references

Checked 2026-10-28 against the installed MongoDB 7.7.0 and Clerk Next.js 7.9.22 SDKs:

- [Clerk Next.js proxy and resource authorization](https://clerk.com/docs/reference/nextjs/clerk-middleware), [server session auth](https://clerk.com/docs/reference/nextjs/app-router/auth), [backend user reads](https://clerk.com/docs/nextjs/guides/users/reading).
- [Clerk public versus unsafe metadata](https://clerk.com/docs/guides/users/extending) and [backend metadata updates](https://clerk.com/docs/reference/backend/user/update-user-metadata).
- [MongoDB connection pools](https://www.mongodb.com/docs/drivers/node/v6.x/connect/connection-options/connection-pools/), [partial indexes](https://www.mongodb.com/docs/manual/core/index-partial/), [TTL indexes and BSON dates](https://www.mongodb.com/docs/v8.0/core/index-ttl/).
- [Atlas custom database roles](https://www.mongodb.com/docs/atlas/security-add-mongodb-roles/), [custom actions](https://www.mongodb.com/docs/atlas/reference/custom-role-actions/), [network access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/).
- [Vercel outbound IP allowlisting](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address).

## Production deployment configuration (Phase 3)

- Node runtime is pinned by `.nvmrc` (`24`) and `package.json` (`24.x`); Vercel installs with `npm ci`, builds with `npm run build`, and deploys Node functions in `bom1`. Keep the MongoDB Atlas cluster in a nearby supported region and use replica-set/sharded topology for transactions.
- Set `MONGODB_DB_NAME`, `MONGODB_URI`, `REGISTRY_STATE_ID`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_AUTHORIZED_PARTIES`, and the existing Inngest secrets independently in Vercel Development, Preview and Production. Never expose secret variables with the `NEXT_PUBLIC_` prefix.
- The package name, MongoDB client `appName`, health identifier and Inngest application ID are now `blood-bank-management-system`. The legacy `_registryMeta` seed marker remains unchanged intentionally so existing database ownership and upgrade checks continue to recognize already-seeded records. Event names remain unchanged for compatibility. Re-sync/deploy the Inngest application after changing its app ID; do not rename existing event types or function IDs as part of this identifier correction.
- Registry seed/upgrade/reset tooling requires exact database-name confirmation and refuses to run when `VERCEL_ENV=production`. Production application runtime can connect to a valid production database name; this does not enable destructive seed/reset from a Vercel production function.
- A state ID change does not migrate records. Keep the default for existing pilot data unless a separately reviewed migration is performed.
