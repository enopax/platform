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

### 2. Organisation soft delete is broken
**File**: `src/lib/services/organisation.ts:83-99`

`deleteOrganisation()` does not actually set `isActive: false`. It calls `update()` with just the existing name — a no-op.

```typescript
// This does nothing useful:
await store.organisations.update(organisationId, { name: organisation.name });
```

**Fix**: The `IOrganisationRepository.update()` needs to support updating `isActive`. Add it to the update interface and pass `{ isActive: false }`.

### 3. Dockerfile still references Prisma
**File**: `Dockerfile.prod:19-59`, `docker-entrypoint.sh:7`

The production Dockerfile still runs `npx prisma generate`, installs OpenSSL for Prisma, and copies Prisma client files. The entrypoint runs `npx prisma db push` on every start.

**Fix**: Rewrite Dockerfile to remove all Prisma steps. Add `data/` volume mount for TinyBase persistence. Remove `docker-entrypoint.sh` Prisma commands.

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

### 5. Project counts hardcoded to 0 in sidebar
**File**: `src/app/(main)/orga/layout.tsx:41`

```typescript
_count: { projects: 0, members: memberCount },
```

Organisation sidebar always shows 0 projects because the count was previously done via Prisma `_count` include and wasn't replicated.

**Fix**: Call `store.projects.findByOrgId(org.id)` and use `.length` for the count.

### 6. No user registration flow in the platform
**Current state**: Users can only be created via:
- CLI: `./idp/scripts/add-user.sh <name> <email> <password>`
- Dex gRPC API
- Auto-provisioning on first OIDC login (but requires existing Dex user)

The old Credentials-based registration form (`/signup`) no longer works since auth moved to Dex OIDC.

**Fix**: Either add a registration page in Dex's UI, or add a platform page that calls the Dex gRPC API to create users.

### 7. Middleware uses separate empty NextAuth instance
**File**: `src/middleware.ts`

Middleware creates its own NextAuth instance with empty providers instead of sharing the auth.ts config. This is because the Edge runtime can't do OIDC discovery.

```typescript
const { auth } = NextAuth({
  providers: [],
  pages: { signIn: '/signin' },
})
```

**Impact**: Middleware can check if a session JWT exists but can't validate the provider. Functionally works but architecturally fragile.

**Fix**: Use NextAuth v5's recommended pattern for Edge-compatible middleware config.

---

## Medium

### 8. Dead code: auth.config.ts
**File**: `src/lib/auth.config.ts`

Empty config file with just `providers: []`. No longer imported by auth.ts or middleware.ts.

**Fix**: Delete the file.

### 9. Email confirmation endpoint not implemented
**File**: `src/app/api/email/confirm/route.ts`

Returns 501 Not Implemented. Has a comment referencing "MongoDB models" — predates even the Prisma era.

**Fix**: Implement or remove the endpoint.

### 10. Team member references in AddMemberForm
**File**: `src/components/form/AddMemberForm.tsx`

Imports `addTeamMember` action which was removed during migration (Team model doesn't exist in schema).

**Fix**: Remove the Team-related code from the form or repurpose for organisation members.

### 11. Lost test coverage
**Previous state**: CLAUDE.md mentions "130+ tests". The old Prisma-mocking service tests (user, organisation, project) were deleted in Phase 13.

**Current state**: 173 store tests + 8 action tests = 181 tests. But no integration tests, no component tests that exercise the full stack.

**Fix**: Add integration tests that test the full flow (auth → store → response).

### 12. getUserOrganisations doesn't return member counts
**File**: `src/lib/services/organisation.ts:55-67`

Returns `memberCount: 0` for all organisations because the member count query was simplified during migration.

```typescript
return memberships.map(m => ({
  ...m.organisation,
  memberCount: 0, // was: organisation._count.members
}));
```

**Fix**: Count members per org using `store.organisationMembers.findByOrgId()`.

---

## Low

### 13. Stale CLAUDE.md migration references
**File**: `CLAUDE.md` (both platform and Platform level)

References "TinyBase v7.1.0 installed", "4% complete", migration plan docs that don't exist. All stale from before the migration actually happened.

**Fix**: Update CLAUDE.md to reflect current state (TinyBase v8.0.2, migration complete, Dex OIDC auth).

### 14. Old signup/credentials pages still exist
**Files**: `src/app/(auth)/signin/credentials/page.tsx`, `src/app/(auth)/signin/(email)/`, `src/app/(auth)/signup/`

The old Credentials and email sign-in pages still exist but are non-functional since auth switched to Dex OIDC.

**Fix**: Delete the old pages or redirect to the new `/signin` page.

### 15. data/ directory needs .gitkeep or seed script
**Current state**: `data/` is in `.gitignore`. A fresh clone has no data directory and no way to seed initial data.

**Fix**: Create a `scripts/seed.ts` that populates initial data, or add a `data/.gitkeep`.
