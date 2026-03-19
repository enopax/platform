# Migration Plan: PostgreSQL + Prisma → TinyBase v8.0

**Started**: 2026-03-19
**Integration branch**: `tiny-dev`
**Target**: Remove PostgreSQL + Prisma entirely, replace with TinyBase v8.0 file-based storage

---

## Git Workflow

All migration work happens on the **`tiny-dev`** branch. Individual phases branch off `tiny-dev` and merge back via PR.

```
main (production)
 └── tiny-dev (integration branch for all migration work)
      ├── feat/data-store-layer        → PR → tiny-dev  ✅ Phase 0
      ├── feat/migrate-apikey          → PR → tiny-dev     Phase 1
      ├── feat/tinybase-apikey         → PR → tiny-dev     Phase 2
      ├── feat/migrate-audit-log       → PR → tiny-dev     Phase 3
      ├── ...                          → PR → tiny-dev     Phase 4-13
      └── (when complete)              → PR → main         Final merge
```

**Rules**:
- Each phase = one branch off `tiny-dev` + one PR into `tiny-dev`
- Never push migration work directly to `main`
- `tiny-dev` merges to `main` only when all phases are complete and tested
- Keep `tiny-dev` rebased on `main` periodically to avoid drift

---

## Context

The Platform uses PostgreSQL + Prisma ORM for all data storage (20 models, 67 files importing Prisma). We are replacing this with TinyBase v8.0 file-based persistence to:

- **Simplify deployment** — no separate database process needed
- **Align with single-server architecture** — file-based storage on disk
- **Leverage TinyBase v8 features** — objects/arrays in cells, middleware for validation
- **Remove Docker dependency** — no PostgreSQL container required for development

**Auth decision**: Switch from NextAuth + Credentials to Dex OIDC (custom fork already in `dex/`, setup in `idp/`). This eliminates 5 auth models (Account, Session, Authenticator, VerificationToken), leaving **15 business models** to migrate.

**Approach**: Introduce TinyBase early (Phase 2) to prove the pattern end-to-end before migrating all models.

---

## Architecture: Data Store Abstraction Layer

A clean `src/lib/store/` layer hides storage implementation from the rest of the app.

```
src/lib/store/
  index.ts                    -- Single import point, re-exports everything
  types.ts                    -- All model types + enums (replaces @prisma/client)
  data-store.ts               -- DataStore singleton: getStore() / initStore()
  repositories/
    user.repository.ts        -- IUserRepository interface
    organisation.repository.ts
    project.repository.ts
    api-key.repository.ts
    resource.repository.ts
    audit-log.repository.ts
    join-request.repository.ts
    user-file.repository.ts
    user-storage.repository.ts
  prisma/                     -- Temporary Prisma implementations (deleted in Phase 13)
    api-key.prisma.ts
    ...
  tinybase/                   -- TinyBase implementations (added per phase)
    store.ts                  -- TinyBase store + file persister setup
    api-key.tinybase.ts
    ...
```

**Key design decisions**:
- `types.ts` owns all model types — nothing imports from `@prisma/client`
- Repository interfaces define the data access contract per model
- `getStore().users.findById(id)` is the single access pattern
- Swapping Prisma→TinyBase for a model = one line change in DataStore constructor
- Services remain as business-logic wrappers over repositories
- Tests run against the interface — backend-agnostic

**Import convention** (after migration):
```typescript
import { User, getStore } from '@/lib/store';
```

---

## Data Model Dependencies

```
User (root — no dependencies, everything depends on it)
├── ApiKey (leaf)
├── MembershipAuditLog (leaf, append-only)
├── UserStorageQuota (leaf, 1:1)
├── UserStorageMetrics (leaf)
├── UserStorageActivity (leaf)
├── Organisation (depends on User as owner)
│   ├── OrganisationMember (depends on User + Organisation)
│   ├── OrganisationJoinRequest (depends on User + Organisation)
│   ├── Project (depends on Organisation)
│   │   └── UserFile (depends on User + Project)
│   └── Resource (depends on User + Organisation)
│       └── ProjectResource (depends on Project + Resource)
```

**Strategy**: Start with leaf models (fewest dependencies), prove TinyBase early, work inward toward root models.

---

## Phase Tracker

| Phase | Description | Branch | PR | Status |
|-------|-------------|--------|-----|--------|
| 0 | Data store abstraction layer + types | `feat/data-store-layer` | — | ✅ Done |
| 1 | ApiKey — first Prisma repository | `feat/migrate-apikey` | #31 | ✅ Done |
| 2 | TinyBase for ApiKey — prove the pattern | `feat/tinybase-apikey` | #32 | ✅ Done |
| 3 | MembershipAuditLog (TinyBase) | `feat/migrate-audit-log` | #33 | ✅ Done |
| 4 | User storage models (Quota + Metrics + Activity) | `feat/migrate-user-storage` | #34 | ✅ Done |
| 5 | Bulk type import migration (~28 components) | `refactor/store-type-imports` | #35 | ✅ Done |
| 6 | User model | `feat/migrate-user` | #36 | ✅ Done |
| 7 | Organisation + OrganisationMember | `feat/migrate-organisation` | #37 | ✅ Done |
| 8 | OrganisationJoinRequest | `feat/migrate-join-request` | #38 | ✅ Done |
| 9 | Project | `feat/migrate-project` | #39 | ✅ Done |
| 10 | Resource + ProjectResource | `feat/migrate-resource` | #40 | ✅ Done |
| 11 | UserFile | `feat/migrate-user-file` | — | ⬜ |
| 12 | Switch auth to Dex OIDC | `feat/dex-oidc-auth` | — | ⬜ |
| 13 | Remove Prisma + PostgreSQL | `chore/remove-prisma` | — | ⬜ |

---

## Phase Details

### Phase 0: Foundation — Data Store Layer + Types ✅

**PR**: `feat: add data store abstraction layer`

Created:
- `src/lib/store/types.ts` — 15 model interfaces + 10 enums as string unions
- `src/lib/store/repositories/` — All repository interfaces
- `src/lib/store/data-store.ts` — DataStore singleton
- `src/lib/store/index.ts` — Barrel export
- `tests/store/types.test.ts` — 24 tests
- Added `store` project to `jest.config.unified.js`

Additive only — no existing code modified.

---

### Phase 1: ApiKey — First Prisma Repository

**PR**: `feat: migrate ApiKey to data store layer`

**Why first**: Leaf model, only 4 files use it, simple CRUD, no complex queries.

**Create**:
- `src/lib/store/prisma/api-key.prisma.ts` — Prisma implementation of `IApiKeyRepository`

**Modify**:
- `src/lib/store/data-store.ts` — wire up ApiKey repository
- `src/actions/api-key.ts` — `prisma.apiKey.*` → `getStore().apiKeys.*`
- `src/app/api/developer/api-keys/create/route.ts`
- `src/app/api/developer/api-keys/delete/route.ts`
- `src/app/(main)/account/developer/page.tsx`
- `src/components/table/ApiKey.tsx` — type import from `@/lib/store`

**Tests** (`tests/store/repositories/api-key.test.ts`):
```
GIVEN a user with 0 API keys
WHEN I create a key with name "Test Key" and permissions ["read"]
THEN countByUserId returns 1

GIVEN an API key exists
WHEN I delete it by ID
THEN findById returns null
```

**Verify**: Navigate to developer page, create/delete API key.

---

### Phase 2: TinyBase for ApiKey — Prove the Pattern

**PR**: `feat: add TinyBase v8 and implement ApiKey store`

**This is where TinyBase enters.** Install `tinybase@^8.0.0`.

**Create**:
- `src/lib/store/tinybase/store.ts` — TinyBase store setup + file persister
- `src/lib/store/tinybase/api-key.tinybase.ts` — `IApiKeyRepository` backed by TinyBase

Swap ApiKey from Prisma→TinyBase in DataStore constructor. Existing tests must pass unchanged.

Use TinyBase v8 middleware for validation (reject empty key names).

**Additional tests**: File persistence (write, restart, read back).

---

### Phase 3: MembershipAuditLog

**PR**: `feat: migrate audit log to data store`

Append-only model, 2 files use it. Create Prisma + TinyBase implementations.

**Modify**: `src/lib/auditLog.ts`, `src/lib/services/organisation-join-request.ts`

**Tests**:
```
GIVEN no audit logs for org "org-1"
WHEN I log an ADDED action
THEN getAuditLogs returns 1 entry with user and actor details
```

---

### Phase 4: User Storage Models (Quota + Metrics + Activity)

**PR**: `feat: migrate user storage models to data store`

Three User-dependent leaf models, thematically related. Migrate together.

**Tests**:
```
GIVEN a user with FREE_500MB quota
WHEN I update tier to PRO_50GB
THEN findByUserId returns updated quota with correct allocatedBytes
```

---

### Phase 5: Bulk Type Import Migration

**PR**: `refactor: replace @prisma/client type imports with store types`

~28 component files import types from `@prisma/client`. Replace all with `@/lib/store`.

Zero runtime changes — purely type-level. Verify with `npm run build`.

**Key files**: `src/components/table/`, `src/components/form/`, `src/components/search/`, `src/components/context/`, `src/components/navigation/`

---

### Phase 6: User Model

**PR**: `feat: migrate User model to data store`

Critical model — everything depends on it. Well-isolated in `UserService` (212 lines).

**Modify**:
- `src/lib/services/user.ts` — refactor to use `getStore().users.*`
- `src/lib/auth.ts` — `authorize` callback uses `getStore().users.findByEmail()`
- `src/actions/user.ts`
- Admin pages with direct Prisma user queries

**Tests**:
```
GIVEN no users exist
WHEN I create user with email "test@example.com" and role CUSTOMER
THEN findByEmail returns the user with generated ID

GIVEN users alice, bob, carol exist
WHEN I searchUsers("bo", limit=10)
THEN returns 1 result matching bob
```

---

### Phase 7: Organisation + OrganisationMember

**PR**: `feat: migrate Organisation models to data store`

Migrate together — `OrganisationService` uses both in nearly every method.

**Challenge**: Prisma `_count` and nested `include`. Solve with specific methods like `findByIdWithMemberCount()`.

**Modify**: `src/lib/services/organisation.ts`, `src/lib/permissions.ts`, org pages/actions.

---

### Phase 8: OrganisationJoinRequest

**PR**: `feat: migrate join request to data store`

Depends on Phase 6+7. Modify `src/lib/services/organisation-join-request.ts`.

---

### Phase 9: Project

**PR**: `feat: migrate Project model to data store`

Depends on Phase 7. Modify `src/lib/services/project.ts`, project pages/actions.

---

### Phase 10: Resource + ProjectResource

**PR**: `feat: migrate Resource models to data store`

Modify `src/actions/resource.ts`, `src/lib/deployment-service.ts`, resource pages.

---

### Phase 11: UserFile

**PR**: `feat: migrate UserFile to data store`

Complex — largest dataset, multiple indices, BigInt fields. Depends on User + Project.

---

### Phase 12: Switch Auth to Dex OIDC

**PR**: `feat: replace NextAuth with Dex OIDC authentication`

Major simplification. Dex fork (`dex/`) and IDP setup (`idp/`) already production-ready.

**Remove**:
- `next-auth`, `@auth/prisma-adapter`, `@auth/core` from dependencies
- `src/lib/auth.ts`, `src/lib/auth.config.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- 5 Prisma models: Account, Session, Authenticator, VerificationToken

**Add**:
- OIDC client integration (standard OpenID Connect flow against Dex)
- Session management via JWT/cookies (issued by app after OIDC callback)
- User provisioning on first OIDC login (create User in TinyBase if not exists)

**Modify**:
- All `auth()` calls → new session helper
- Middleware for route protection
- Login/logout UI components

**Tests**:
```
GIVEN a valid OIDC token from Dex
WHEN the callback endpoint processes it
THEN a User record is created/found in TinyBase AND a session JWT is issued

GIVEN an expired session
WHEN accessing a protected route
THEN redirect to Dex login
```

---

### Phase 13: Remove Prisma + PostgreSQL

**PR**: `chore: remove Prisma and PostgreSQL dependency`

- Delete `prisma/schema.prisma`, `src/lib/prisma.ts`, `src/lib/store/prisma/`
- Remove `@prisma/client`, `prisma` from `package.json`
- Remove `prisma generate && prisma db push` from `postinstall`
- Remove PostgreSQL from `docker-compose.yml` and `docker-compose.prod.yml`
- Write `scripts/seed.ts` for sample data
- Update all documentation

---

## TinyBase File Storage Layout

```
data/
  users/<id>.json
  users/indices/email.jsonl
  organisations/<id>.json
  organisations/indices/name.jsonl
  api-keys/<id>.json
  api-keys/indices/user-id.jsonl
  api-keys/indices/hashed-key.jsonl
  projects/<id>.json
  projects/indices/org-id.jsonl
  resources/<id>.json
  resources/indices/org-id.jsonl
  user-files/<id>.json
  user-files/indices/user-id.jsonl
  audit-logs/<id>.json
  storage-quotas/<id>.json
  storage-metrics/<id>.json
  storage-activity/<id>.json
```

- One JSON file per record
- JSONL index files for lookup fields (unique constraints, foreign keys)
- Atomic writes via temp-file + rename pattern
- Crash-safe — no partial writes

---

## Testing Strategy (BDD)

Each phase adds tests in `tests/store/repositories/<model>.test.ts`:

1. **Interface contract tests** — validate repository API against in-memory mock
2. **TinyBase implementation tests** — validate real storage against temp directory

**No Prisma implementation tests.** Prisma is a temporary bridge — it already works and doesn't need new test coverage.

Test project in `jest.config.unified.js`:
```js
{ displayName: 'store', testMatch: ['<rootDir>/tests/store/**/*.test.ts'] }
```

Run store tests: `npx jest --selectProjects store`

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Case-insensitive search is PostgreSQL-specific | `.toLowerCase()` comparison in TinyBase. Fine for expected data volumes. |
| BigInt fields don't serialise to JSON | Convert to string in storage, parse back on read. |
| Prisma `_count` / nested includes hard to abstract | Specific methods (e.g. `findWithMemberCount`) — no generic include API. |
| Dex OIDC switch touches many auth files | Can split into sub-PRs. Dex already production-ready. |
| Concurrent writes | TinyBase single-process model fine for single-server. Document limitation. |
| Data migration from PostgreSQL | One-time `scripts/migrate-data.ts` reads from PG, writes to `data/`. |

---

## Verification Checklist

**After each phase**:
1. `npm run build` succeeds
2. `npm test` — all existing + new tests pass
3. Manual smoke test of affected feature
4. No imports from `@prisma/client` in modified files (except during transition)

**After Phase 13 (complete)**:
1. `grep -r "prisma" src/` returns nothing
2. App starts without Docker/PostgreSQL: `npm run dev` only
3. Full user journey: login via Dex → create org → create project → deploy resource
4. API keys work end-to-end
5. Auth flow via Dex OIDC (login, logout, session persistence)

---

## Files Most Affected

| File | Phase | Notes |
|------|-------|-------|
| `src/lib/prisma.ts` | 13 (delete) | Replaced by `store/data-store.ts` |
| `src/lib/auth.ts` | 12 (replace) | NextAuth → Dex OIDC |
| `src/lib/auth.config.ts` | 12 (delete) | NextAuth config |
| `src/lib/services/user.ts` | 6 | Refactor to use repository |
| `src/lib/services/organisation.ts` | 7 | Most complex service |
| `src/lib/services/project.ts` | 9 | Refactor to use repository |
| `src/lib/permissions.ts` | 7 | Direct Prisma membership checks |
| `src/lib/auditLog.ts` | 3 | Direct Prisma audit writes |
| `src/actions/api-key.ts` | 1 | First migration target |
| `src/actions/user.ts` | 6 | User registration/update |
| `prisma/schema.prisma` | 13 (delete) | Source of truth for types.ts |
