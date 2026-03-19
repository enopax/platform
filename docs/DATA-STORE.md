# Data Store

The platform uses **TinyBase v8** with a custom file-per-record persister for all data storage. No database process required.

## Architecture

```
src/lib/store/
  index.ts                    -- Single import point
  types.ts                    -- All model types + enums
  data-store.ts               -- DataStore singleton (getStoreAsync)
  repositories/               -- Interface per model
  tinybase/
    file-record-persister.ts  -- Custom persister (file-per-record + indexes)
    user.tinybase.ts          -- Repository implementations
    organisation.tinybase.ts
    ...
```

### Access Pattern

```typescript
import { getStoreAsync, type User } from '@/lib/store';

const store = await getStoreAsync();
const user = await store.users.findByEmail('alice@example.com');
```

All data access goes through repository interfaces. Never access TinyBase directly outside of `src/lib/store/tinybase/`.

## File Storage Layout

```
data/
  users/
    abc123def456.json                  -- one JSON file per record
    789ghi012jkl.json
    _index/
      email.json                       -- {"alice@example.com": "abc123def456"}
  organisations/
    org001.json
    _index/
      name.json
  organisation-members/
    mem001.json
    _index/
      userId.json                      -- {"user1": ["mem001", "mem002"]}
      organisationId.json
  projects/
    proj001.json
    _index/
      organisationId.json
  api-keys/
    key001.json
    _index/
      userId.json
      hashedKey.json
  resources/
    res001.json
    _index/
      organisationId.json
  project-resources/
    pr001.json
    _index/
      projectId.json
      resourceId.json
  audit-logs/
    log001.json
  join-requests/
    req001.json
    _index/
      organisationId.json
  user-files/
    file001.json
    _index/
      userId.json
      projectId.json
  storage-quotas/
    quota001.json
    _index/
      userId.json
  storage-metrics/
    metrics001.json
  storage-activity/
    activity001.json
  verification-tokens/
    <token>.json                       -- email verification tokens (24h expiry)
```

### Record Format

Each record is a plain JSON file with the row's cell values:

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "role": "CUSTOMER",
  "storageTier": "FREE_500MB",
  "createdAt": "2026-03-19T15:30:00.000Z",
  "updatedAt": "2026-03-19T15:30:00.000Z"
}
```

### Index Format

Index files map cell values to row IDs for O(1) lookups:

```json
{
  "alice@example.com": "abc123def456",
  "bob@example.com": "789ghi012jkl"
}
```

Multi-value indexes (one-to-many):
```json
{
  "org-1": ["mem001", "mem002", "mem003"],
  "org-2": ["mem004"]
}
```

## FileRecordPersister

Custom persister at `src/lib/store/tinybase/file-record-persister.ts`.

### Features
- **File-per-record**: each TinyBase row → `data/<table>/<id>.json`
- **Atomic writes**: temp file + rename pattern (crash-safe)
- **Auto-save**: 50ms debounce after row changes via TinyBase listeners
- **JSON indexes**: `data/<table>/_index/<field>.json` for O(1) lookups
- **Index maintenance**: auto-updated on create, update, delete
- **File permissions**: records written with `0o600`

### Index Configuration

Defined in `data-store.ts`:

```typescript
const TABLE_CONFIG = [
  { tableName: 'users', indexes: [{ name: 'email', cellId: 'email' }] },
  { tableName: 'organisations', indexes: [{ name: 'name', cellId: 'name' }] },
  { tableName: 'organisation-members', indexes: [
    { name: 'userId', cellId: 'userId' },
    { name: 'organisationId', cellId: 'organisationId' },
  ]},
  // ...
];
```

### Usage in Repositories

Repositories accept an optional persister for index lookups with linear scan fallback:

```typescript
async findByEmail(email: string): Promise<User | null> {
  if (this.persister) {
    const ids = this.persister.lookupIndex('users', 'email', email);
    if (ids.length > 0) {
      const row = this.store.getRow(TABLE, ids[0]);
      if (row.email) return rowToUser(ids[0], row);
    }
    return null;
  }
  // Fallback: linear scan (used in tests without persister)
  for (const id of this.store.getRowIds(TABLE)) {
    const row = this.store.getRow(TABLE, id);
    if (row.email === email) return rowToUser(id, row);
  }
  return null;
}
```

## Models

15 models, all defined as TypeScript interfaces in `src/lib/store/types.ts`:

| Model | Table | Key Indexes |
|-------|-------|-------------|
| User | `users` | email |
| Organisation | `organisations` | name |
| OrganisationMember | `organisation-members` | userId, organisationId |
| Project | `projects` | organisationId |
| Resource | `resources` | organisationId |
| ProjectResource | `project-resources` | projectId, resourceId |
| ApiKey | `api-keys` | userId, hashedKey |
| MembershipAuditLog | `audit-logs` | — |
| OrganisationJoinRequest | `join-requests` | organisationId |
| UserFile | `user-files` | userId, projectId |
| UserStorageQuota | `storage-quotas` | userId |
| UserStorageMetrics | `storage-metrics` | — |
| UserStorageActivity | `storage-activity` | — |

## Type Conventions

All enums are string unions (not TypeScript enums):

```typescript
type UserRole = 'GUEST' | 'CUSTOMER' | 'ADMIN';
type OrganisationRole = 'MEMBER' | 'MANAGER' | 'ADMIN' | 'OWNER';
type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
```

Import types and store access from one place:

```typescript
import { type User, type Organisation, getStoreAsync } from '@/lib/store';
```

## Testing

Tests at `tests/store/` — 243 tests total:

- `tests/store/tinybase/*.test.ts` — repository tests (TinyBase in-memory, no persister)
- `tests/store/tinybase/file-record-persister.test.ts` — persister + index tests (temp directory)
- `tests/services/*.test.ts` — service-level tests (real TinyBase stores, no mocks)

Run: `npx jest --selectProjects store services`

### Test Helper

```typescript
import { createTestStore } from './helpers';
import { setStore, resetStore } from '@/lib/store/data-store';

beforeEach(() => {
  resetStore();
  setStore(createTestStore()); // in-memory TinyBase, no persister
});
```
