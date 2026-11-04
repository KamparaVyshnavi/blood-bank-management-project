# Phase 3 — Clerk administration and deployment consistency

## Clerk directory

The Administration page is restricted by the existing server-side `identity()` check to `STATE_ADMIN`. It reads accounts from Clerk using the server SDK; it does not create a MongoDB `users` collection or permit role edits. The directory scans at most 500 recent Clerk accounts, then filters them to the active `REGISTRY_STATE_ID` partition before projecting them. A user without the active state ID is not shown. Accounts with the active state ID but no recognized registry role are shown as `Unassigned`. Donor-role accounts are omitted entirely so the administrative directory cannot link anonymous donor records to Clerk identities.

Only an allowlisted projection is passed to the client: Clerk user ID, display name, primary email, validated registry role label, institution identifier (never tenant ID), banned/locked status and last sign-in timestamp. Raw metadata, phone numbers, addresses, session data and credentials are not returned. A Clerk API failure produces an explicit unavailable state rather than a fabricated directory. The view is read-only; role assignment remains in Clerk public metadata and authorization still re-reads the current user server-side on each protected request.

## MongoDB naming

`MONGODB_DB_NAME` no longer requires a `pulsegrid_dev/demo/test` prefix. The runtime accepts 1–63-byte names containing ASCII letters, digits, `_` or `-`, and rejects MongoDB system databases `admin`, `local` and `config`. This permits normal environment names such as `bloodbank_dev`, `bloodbank_preview` and `bloodbank_prod` without weakening URI secrecy or tenant scoping.

Seed/upgrade/reset tooling still requires the exact database name as confirmation, verifies the existing application ownership marker before changing a non-empty database, and refuses destructive execution inside a Vercel Production runtime. The existing `_registryMeta` marker is deliberately retained so established records remain recognized.

## State partition

`REGISTRY_STATE_ID` selects the active state partition and defaults to `maharashtra-pilot` for backwards compatibility. The identifier is validated at startup. Every Clerk `publicMetadata.registry.stateId` and every persisted record participating in that environment must match it. Changing the setting selects a different partition; it does not migrate, relabel or copy existing records. Keep the default unless a separate, reviewed data migration is planned.

## Application identifiers and Vercel

The npm package, MongoDB client `appName`, health identifier and Inngest app ID use `blood-bank-management-system`. Existing Inngest event names and function IDs remain unchanged. Re-sync/deploy the Inngest app after the app ID change so its registered functions and event subscriptions are associated with the new app identity.

Vercel configuration was already aligned and is retained: Next.js framework, `bom1` region, `npm ci` install and `npm run build`. Node 24 is pinned in `.nvmrc` and `package.json` `engines`. Configure `MONGODB_DB_NAME`, `MONGODB_URI`, `REGISTRY_STATE_ID`, Clerk keys/authorized parties and Inngest secrets independently for Development, Preview and Production. Keep all credentials server-side; only Clerk's publishable key and the existing public path variables use `NEXT_PUBLIC_`.

## Validation performed for this change

- TypeScript transpilation/syntax diagnostics on all modified source and test files.
- Runtime smoke checks for allowed/rejected MongoDB names, default/custom state IDs, state ID validation, Clerk role projection and privacy filtering.
- JSON parsing and consistency checks for `package.json`, `package-lock.json` and `vercel.json`.
- Static deployment assertions for Node 24, Vercel region and install/build commands.

Full Vitest, ESLint, Next typecheck and production build require installing the locked dependencies under Node 24. No live Clerk, Atlas or Vercel account was connected during this source audit.
