# Open TODOs — TinyBase Migration

Technical debt, shortcuts, and incomplete work from the PostgreSQL → TinyBase migration.

---

## Critical

### 1. Single store.json instead of file-per-record storage
**File**: `src/lib/store/data-store.ts:46-54`

All 15 models are stored in a single `data/store.json` file via TinyBase's default file persister. The plan called for file-per-record layout (`data/users/<id>.json`, etc.).

**Why**: TinyBase's built-in `createFilePersister` writes the entire store to one file. File-per-record requires a custom persister.

**Impact**: Single large JSON file, no per-record git diffs, full file rewrite on every change, risk of total data loss from single file corruption.

**Fix**: Build a custom TinyBase persister that writes each row as a separate JSON file in a subdirectory per table.

### ~~2. Organisation soft delete is broken~~ ✅ Fixed
~~`deleteOrganisation()` was a no-op.~~
Fixed: `update()` now accepts `isActive` flag, `deleteOrganisation()` passes `{ isActive: false }`.

### ~~3. Dockerfile still references Prisma~~ ✅ Fixed
~~Dockerfile ran `prisma generate`, installed OpenSSL for Prisma, copied Prisma client files. Entrypoint ran `prisma db push`.~~
Fixed: Removed all Prisma steps, deleted `docker-entrypoint.sh`, added `DATA_DIR=/app/data` env var and data directory creation. Uses simple `CMD ["node", "server.js"]`.

---

## High

### 4. All repositories use linear scans (no indices)
**Files**: All `src/lib/store/tinybase/*.tinybase.ts`

Every lookup (findByEmail, findByName, findByUserAndOrg, etc.) iterates all rows in the table. No JSONL index files or TinyBase indexes are used.

**Most critical**:
- `user.findByEmail()` — called on every auth request
- `apiKey.findByHashedKey()` — called on every API request
- `organisationMember.findByUserAndOrg()` — called on every permission check

**Why**: Linear scans are simple and correct. Performance is acceptable for small datasets (hundreds of records). Indices add complexity.

**Fix**: Implement JSONL index files for high-frequency lookups, or use TinyBase's built-in `createIndexes()` API.

### ~~5. Project counts hardcoded to 0 in sidebar~~ ✅ Fixed
~~Organisation sidebar always showed 0 projects.~~
Fixed: Sidebar now fetches project counts per org via `store.projects.findByOrgId()`.

### 6. No user registration flow in the platform
**Current state**: Users can only be created via:
- CLI: `./idp/scripts/add-user.sh <name> <email> <password>`
- Dex gRPC API
- Auto-provisioning on first OIDC login (but requires existing Dex user)

The old Credentials-based registration form (`/signup`) no longer works since auth moved to Dex OIDC.

**Fix**: Either add a registration page in Dex's UI, or add a platform page that calls the Dex gRPC API to create users.

### ~~7. Middleware uses separate empty NextAuth instance~~ ✅ Fixed
~~Middleware had its own empty NextAuth instance.~~
Fixed: Follows Auth.js v5 recommended pattern — `auth.config.ts` has Edge-safe config (pages, `authorized` callback), shared by both middleware and `auth.ts`. OIDC provider only in `auth.ts` (Node runtime).

---

## Medium

### ~~8. Dead code: auth.config.ts~~ ✅ Fixed
~~Empty config file no longer imported by anything.~~
Fixed: Recreated properly as Edge-safe shared config (see #7).

### 9. Email confirmation endpoint not implemented
**File**: `src/app/api/email/confirm/route.ts`

Returns 501 Not Implemented. Has a comment referencing "MongoDB models" — predates even the Prisma era.

**Fix**: Implement or remove the endpoint.

### ~~10. Team member references in AddMemberForm~~ ✅ Fixed
~~Imported `addTeamMember` action which doesn't exist.~~
Fixed: Deleted dead `AddMemberForm.tsx`.

### 11. Lost test coverage
**Previous state**: CLAUDE.md mentions "130+ tests". The old Prisma-mocking service tests (user, organisation, project) were deleted in Phase 13.

**Current state**: 173 store tests + 8 action tests = 181 tests. But no integration tests, no component tests that exercise the full stack.

**Fix**: Add integration tests that test the full flow (auth → store → response).

### ~~12. getUserOrganisations doesn't return member counts~~ ✅ Fixed
~~Returned `memberCount: 0` for all organisations.~~
Fixed: Now counts members per org via `store.organisationMembers.findByOrgId()`.

---

## Low

### ~~13. Stale CLAUDE.md migration references~~ ✅ Fixed
~~References to Prisma, PostgreSQL, old dev commands.~~
Fixed: Updated CLAUDE.md with TinyBase v8, Dex OIDC, correct dev commands.

### ~~14. Old signup/credentials pages still exist~~ ✅ Fixed
~~Non-functional pages from the Credentials auth era.~~
Fixed: Deleted old signin/credentials, signin/email, and signup pages.

### ~~15. data/ directory needs .gitkeep or seed script~~ ✅ Fixed
~~No way to seed initial data on fresh clone.~~
Fixed: Added `scripts/seed.ts` and `npm run seed` command. Creates admin + user + org + project.
