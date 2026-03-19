# Open TODOs — TinyBase Migration

Technical debt, shortcuts, and incomplete work from the PostgreSQL → TinyBase migration.

---

## Critical

### ~~1. Single store.json instead of file-per-record storage~~ ✅ Fixed
~~All 15 models in a single `data/store.json` file.~~
Fixed: Custom `FileRecordPersister` writes each row as `data/<table>/<id>.json`. Atomic writes via temp-file + rename. Auto-save on row changes with 50ms debounce.

### ~~2. Organisation soft delete is broken~~ ✅ Fixed
~~`deleteOrganisation()` was a no-op.~~
Fixed: `update()` now accepts `isActive` flag, `deleteOrganisation()` passes `{ isActive: false }`.

### ~~3. Dockerfile still references Prisma~~ ✅ Fixed
~~Dockerfile ran `prisma generate`, installed OpenSSL for Prisma, copied Prisma client files. Entrypoint ran `prisma db push`.~~
Fixed: Removed all Prisma steps, deleted `docker-entrypoint.sh`, added `DATA_DIR=/app/data` env var and data directory creation. Uses simple `CMD ["node", "server.js"]`.

---

## High

### ~~4. All repositories use linear scans (no indices)~~ ✅ Fixed
~~Every lookup iterated all rows in the table.~~
Fixed: `FileRecordPersister` maintains JSON index files per indexed field (`data/<table>/_index/<field>.json`). Repositories use `persister.lookupIndex()` for O(1) lookups with linear scan fallback when persister is absent (tests). Indexed fields: user.email, org.name, member.userId/orgId, apiKey.hashedKey/userId, project.orgId, resource.orgId, etc.

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

### ~~11. Lost test coverage~~ ✅ Fixed
~~Old Prisma-mocking service tests deleted, not replaced.~~
Fixed: Rewrote service tests using real TinyBase stores (no mocks). 52 new tests covering UserService, OrganisationService, ProjectService business logic (permissions, validation, soft delete, name uniqueness). Total: 233 tests. Also found and fixed a bug in `createProject` name validation.

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
