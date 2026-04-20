# Quality Improvements Plan

**Date**: 2026-04-19
**Status**: Approved

## Overview

Four improvements to reduce bugs and improve maintainability, ordered by impact.

---

## 1. Deduplicate Routes

**Problem**: `src/app/(main)/[slug]/` and `src/app/(main)/orga/[orgaName]/` are near-identical route trees. 23 files in `orga/[orgaName]` duplicate pages from `[slug]`. Every bug fix must be applied twice.

**Solution**: Delete `orga/[orgaName]` entirely. Keep only `[slug]` which already handles both namespace slugs and org names (see `[slug]/layout.tsx` fallback logic). The `orga/` route group keeps only:
- `orga/page.tsx` — organisations listing
- `orga/layout.tsx` — minimal layout
- `orga/(organisation)/new/page.tsx` — create org form (if it exists here)

**Files to delete** (23 files):
- All of `src/app/(main)/orga/[orgaName]/` recursively

**Links to update**: Any internal links using `/orga/${orgaName}/...` must change to `/${orgaName}/...`. These exist in:
- The deleted `orga/[orgaName]` pages themselves (deleted, so no update needed)
- Any shared components that link to `/orga/` prefixed paths (check and update)

**Risk**: Low — the `[slug]` layout already resolves org names and has all the pages.

---

## 2. Permission Integration Tests

**Problem**: Permission logic has no tests. The SUPERADMIN bypass was scattered across 37 files with no automated detection.

**Solution**: Add Jest integration tests for the permission module.

**Test file**: `src/lib/__tests__/permissions.test.ts`

**Test cases**:
- `checkOrganisationPermissions`:
  - OWNER → `canManage: true, isOwner: true`
  - ADMIN → `canManage: true, isAdmin: true`
  - MANAGER → `canManage: true, isManager: true`
  - MEMBER → `canManage: false`
  - Non-member → `isMember: false, canManage: false`
  - SUPERADMIN (no membership) → `isMember: false, canManage: false`
- `checkProjectPermissions`:
  - Org OWNER → `canManage: true`
  - Org MEMBER (no team access) → `canManage: false`
  - SUPERADMIN (no membership) → `canManage: false`
- `resolveProjectPermissions`:
  - Org OWNER → returns `ADMIN`
  - Team member with DEVELOPER access → returns `DEVELOPER`
  - No access → returns `null`

**Approach**: Mock the store with in-memory data. Test the permission functions directly.

---

## 3. E2E Tests for Golden Paths

**Problem**: UI flows break silently (visibility save, search click, form submissions).

**Solution**: Playwright E2E tests for critical user flows.

**Test file**: `e2e/` directory with Playwright config.

**Golden paths to test**:
1. **Auth flow**: sign in → redirected to /orga
2. **Org CRUD**: create org → see in list → update settings (including visibility) → verify persistence
3. **Project CRUD**: create project → see in org overview → update settings
4. **Navigation**: breadcrumb links work, sidebar context changes per page, search opens command palette
5. **Permissions**: non-member cannot access org pages (gets 404)
6. **Dark mode**: key pages render without invisible text

**Setup**: Requires running Dex + Next.js dev server. Test user created via `add-user.sh` script.

---

## 4. Type-Safe Form Actions

**Problem**: `formData.get('ownerId') as string` returns empty string when field doesn't exist. No compile-time check that forms send the right fields.

**Solution**: Add Zod schemas for form validation in server actions.

**Pattern**:
```typescript
import { z } from 'zod';

const updateOrgSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  isActive: z.string().transform(v => v === 'true').optional(),
});

// In action:
const parsed = updateOrgSchema.safeParse(Object.fromEntries(formData));
if (!parsed.success) {
  return { error: 'Invalid form data', fieldErrors: ... };
}
const { name, visibility, ... } = parsed.data;
```

**Files to update**: All server actions in `src/actions/`:
- `organisation.ts` (create + update)
- `project.ts` (create + update)
- `team.ts` (create + update)
- `resource.ts` (create + update)
- `project-role.ts` (create + update)
- `invitation.ts`
- `register.ts`

**Dependency**: `zod` (check if already installed, otherwise needs install)

---

## Implementation Order

1. **Deduplicate routes** — biggest risk reduction, simplest change
2. **Permission tests** — catches security issues, fast to write
3. **Type-safe form actions** — prevents silent form bugs
4. **E2E tests** — catches UI integration issues, most setup required
