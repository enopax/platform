# Access Control Phase 1A — Store Entities + Permission Resolver

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the data foundation for Teams, Project Access, Visibility, Slugs, and a permission resolver — without changing any UI or routing yet.

**Architecture:** Extend TinyBase store with 4 new entities (Namespace, Team, TeamMember, ProjectAccess) and 3 field additions (slug on User/Org/Project, visibility on Org/Project, ownerType+ownerId on Project). Build a `resolveProjectPermissions()` helper that combines org-role, team grants, and visibility into a single effective role.

**Tech Stack:** TinyBase v8 (file-per-record persister), TypeScript, Jest

**Design spec:** `docs/specs/2026-04-15-access-control-design.md`

**Depends on:** None (builds on current main)

**Followed by:** Plan B (Team CRUD + Project Access UI), Plan C (Flat Routing + Personal Projects)

---

## File Structure

### New files

| File | Responsibility |
|---|---|
| `src/lib/store/types.ts` (modify) | Add `Team`, `TeamMember`, `ProjectAccess`, `Namespace`, `ProjectRole`, `Visibility` types |
| `src/lib/store/repositories/team.repository.ts` | `ITeamRepository` + `ITeamMemberRepository` interfaces |
| `src/lib/store/repositories/project-access.repository.ts` | `IProjectAccessRepository` interface |
| `src/lib/store/repositories/namespace.repository.ts` | `INamespaceRepository` interface |
| `src/lib/store/tinybase/team.tinybase.ts` | TinyBase implementation for Team + TeamMember |
| `src/lib/store/tinybase/project-access.tinybase.ts` | TinyBase implementation for ProjectAccess |
| `src/lib/store/tinybase/namespace.tinybase.ts` | TinyBase implementation for Namespace |
| `src/lib/store/data-store.ts` (modify) | Wire new repositories + TABLE_CONFIG entries |
| `src/lib/store/repositories/index.ts` (modify) | Export new repository types |
| `src/lib/store/index.ts` (modify) | Export new types |
| `src/lib/permissions.ts` (modify) | Add `resolveProjectPermissions()` |
| `tests/store/tinybase/team.tinybase.test.ts` | Team + TeamMember repository tests |
| `tests/store/tinybase/project-access.tinybase.test.ts` | ProjectAccess repository tests |
| `tests/store/tinybase/namespace.tinybase.test.ts` | Namespace repository tests |
| `tests/services/permissions.test.ts` | Permission resolver tests |
| `tests/services/helpers.ts` (modify) | Add new repos to test store factory |

---

## Task 1: ProjectRole + Visibility types

**Files:**
- Modify: `src/lib/store/types.ts`
- Modify: `src/lib/store/index.ts`

- [ ] **Step 1: Add types to types.ts**

Add after the `OrganisationRole` type (line ~3):

```typescript
export type ProjectRole = 'VIEWER' | 'DEVELOPER' | 'DEPLOYER' | 'ADMIN';

export type Visibility = 'PUBLIC' | 'INTERNAL' | 'PRIVATE';

export type NamespaceEntityType = 'USER' | 'ORGANISATION';

export type ProjectOwnerType = 'USER' | 'ORGANISATION';
```

- [ ] **Step 2: Add Team interface**

Add after the `OrganisationMember` interface:

```typescript
export interface Team {
  id: string;
  organisationId: string;
  name: string;
  description: string | null;
  defaultProjectRole: ProjectRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  addedAt: Date;
  addedBy: string;
}
```

- [ ] **Step 3: Add ProjectAccess interface**

Add after the `Project` interface:

```typescript
export interface ProjectAccess {
  id: string;
  projectId: string;
  teamId: string;
  role: ProjectRole;
  grantedAt: Date;
  grantedBy: string;
}
```

- [ ] **Step 4: Add Namespace interface**

```typescript
export interface Namespace {
  id: string;
  slug: string;
  entityType: NamespaceEntityType;
  entityId: string;
  createdAt: Date;
}
```

- [ ] **Step 5: Add slug + visibility fields to Organisation**

Modify the existing `Organisation` interface — add fields after `name`:

```typescript
  slug: string;
  // ... existing fields ...
  visibility: Visibility;
  defaultProjectVisibility: Visibility;
```

- [ ] **Step 6: Add slug + visibility + ownerType to Project**

Modify the existing `Project` interface — add:

```typescript
  slug: string;
  // ... existing fields ...
  ownerType: ProjectOwnerType;
  ownerId: string;
  visibility: Visibility;
```

- [ ] **Step 7: Add slug to User**

Add `slug: string;` after `id` in the `User` interface.

- [ ] **Step 8: Export new types from index.ts**

Add to the type exports in `src/lib/store/index.ts`:

```typescript
  ProjectRole,
  Visibility,
  NamespaceEntityType,
  ProjectOwnerType,
  Team,
  TeamMember,
  ProjectAccess,
  Namespace,
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/store/types.ts src/lib/store/index.ts
git commit -m "feat(types): add Team, TeamMember, ProjectAccess, Namespace + slug/visibility fields"
```

---

## Task 2: Namespace repository

**Files:**
- Create: `src/lib/store/repositories/namespace.repository.ts`
- Create: `src/lib/store/tinybase/namespace.tinybase.ts`
- Create: `tests/store/tinybase/namespace.tinybase.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { createStore } from 'tinybase';
import { TinyBaseNamespaceRepository } from '@/lib/store/tinybase/namespace.tinybase';

describe('TinyBaseNamespaceRepository', () => {
  let store: ReturnType<typeof createStore>;
  let repo: TinyBaseNamespaceRepository;

  beforeEach(() => {
    store = createStore();
    repo = new TinyBaseNamespaceRepository(store);
  });

  it('registers a slug and retrieves it', async () => {
    const ns = await repo.register({ slug: 'enopax', entityType: 'ORGANISATION', entityId: 'org-1' });
    expect(ns.slug).toBe('enopax');
    expect(ns.entityType).toBe('ORGANISATION');

    const found = await repo.findBySlug('enopax');
    expect(found).not.toBeNull();
    expect(found!.entityId).toBe('org-1');
  });

  it('rejects duplicate slugs', async () => {
    await repo.register({ slug: 'felix', entityType: 'USER', entityId: 'user-1' });
    await expect(repo.register({ slug: 'felix', entityType: 'ORGANISATION', entityId: 'org-2' }))
      .rejects.toThrow('already taken');
  });

  it('checks availability', async () => {
    expect(await repo.isAvailable('newslug')).toBe(true);
    await repo.register({ slug: 'newslug', entityType: 'USER', entityId: 'user-1' });
    expect(await repo.isAvailable('newslug')).toBe(false);
  });

  it('deletes a namespace entry', async () => {
    await repo.register({ slug: 'temp', entityType: 'USER', entityId: 'user-1' });
    await repo.delete('temp');
    expect(await repo.findBySlug('temp')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --config jest.config.unified.js tests/store/tinybase/namespace.tinybase.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write repository interface**

Create `src/lib/store/repositories/namespace.repository.ts`:

```typescript
import type { Namespace, NamespaceEntityType } from '../types';

export interface RegisterNamespaceData {
  slug: string;
  entityType: NamespaceEntityType;
  entityId: string;
}

export interface INamespaceRepository {
  register(data: RegisterNamespaceData): Promise<Namespace>;
  findBySlug(slug: string): Promise<Namespace | null>;
  findByEntity(entityType: NamespaceEntityType, entityId: string): Promise<Namespace | null>;
  isAvailable(slug: string): Promise<boolean>;
  delete(slug: string): Promise<void>;
}
```

- [ ] **Step 4: Write TinyBase implementation**

Create `src/lib/store/tinybase/namespace.tinybase.ts`:

```typescript
import type { Store } from 'tinybase';
import type { Namespace, NamespaceEntityType } from '../types';
import type { INamespaceRepository, RegisterNamespaceData } from '../repositories/namespace.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TABLE = 'namespaces';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToNamespace(id: string, row: Record<string, any>): Namespace {
  return {
    id,
    slug: row.slug as string,
    entityType: row.entityType as NamespaceEntityType,
    entityId: row.entityId as string,
    createdAt: new Date(row.createdAt as string),
  };
}

export class TinyBaseNamespaceRepository implements INamespaceRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async register(data: RegisterNamespaceData): Promise<Namespace> {
    const existing = await this.findBySlug(data.slug);
    if (existing) throw new Error(`Slug "${data.slug}" is already taken`);

    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      slug: data.slug.toLowerCase(),
      entityType: data.entityType,
      entityId: data.entityId,
      createdAt: now,
    });

    return rowToNamespace(id, this.store.getRow(TABLE, id));
  }

  async findBySlug(slug: string): Promise<Namespace | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex(TABLE, 'slug', slug.toLowerCase());
      if (ids.length > 0) {
        const row = this.store.getRow(TABLE, ids[0]);
        if (row.slug) return rowToNamespace(ids[0], row);
      }
      return null;
    }
    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.slug === slug.toLowerCase()) return rowToNamespace(id, row);
    }
    return null;
  }

  async findByEntity(entityType: NamespaceEntityType, entityId: string): Promise<Namespace | null> {
    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.entityType === entityType && row.entityId === entityId) {
        return rowToNamespace(id, row);
      }
    }
    return null;
  }

  async isAvailable(slug: string): Promise<boolean> {
    return (await this.findBySlug(slug)) === null;
  }

  async delete(slug: string): Promise<void> {
    const ns = await this.findBySlug(slug);
    if (ns) this.store.delRow(TABLE, ns.id);
  }
}
```

- [ ] **Step 5: Run tests — should pass**

Run: `npx jest --config jest.config.unified.js tests/store/tinybase/namespace.tinybase.test.ts`
Expected: 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/store/repositories/namespace.repository.ts \
        src/lib/store/tinybase/namespace.tinybase.ts \
        tests/store/tinybase/namespace.tinybase.test.ts
git commit -m "feat(store): add Namespace repository with global slug uniqueness"
```

---

## Task 3: Team + TeamMember repository

**Files:**
- Create: `src/lib/store/repositories/team.repository.ts`
- Create: `src/lib/store/tinybase/team.tinybase.ts`
- Create: `tests/store/tinybase/team.tinybase.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { createStore } from 'tinybase';
import { TinyBaseTeamRepository, TinyBaseTeamMemberRepository } from '@/lib/store/tinybase/team.tinybase';

describe('TinyBaseTeamRepository', () => {
  let store: ReturnType<typeof createStore>;
  let teamRepo: TinyBaseTeamRepository;
  let memberRepo: TinyBaseTeamMemberRepository;

  beforeEach(() => {
    store = createStore();
    teamRepo = new TinyBaseTeamRepository(store);
    memberRepo = new TinyBaseTeamMemberRepository(store);
  });

  describe('teams', () => {
    it('creates a team with defaultProjectRole', async () => {
      const team = await teamRepo.create({
        organisationId: 'org-1',
        name: 'Backend',
        description: 'Backend developers',
        defaultProjectRole: 'DEVELOPER',
      });
      expect(team.name).toBe('Backend');
      expect(team.defaultProjectRole).toBe('DEVELOPER');
    });

    it('finds teams by organisation', async () => {
      await teamRepo.create({ organisationId: 'org-1', name: 'A', defaultProjectRole: 'DEVELOPER' });
      await teamRepo.create({ organisationId: 'org-1', name: 'B', defaultProjectRole: 'DEPLOYER' });
      await teamRepo.create({ organisationId: 'org-2', name: 'C', defaultProjectRole: 'VIEWER' });

      const orgTeams = await teamRepo.findByOrgId('org-1');
      expect(orgTeams).toHaveLength(2);
    });

    it('updates a team', async () => {
      const team = await teamRepo.create({ organisationId: 'org-1', name: 'Old', defaultProjectRole: 'VIEWER' });
      const updated = await teamRepo.update(team.id, { name: 'New', defaultProjectRole: 'DEPLOYER' });
      expect(updated.name).toBe('New');
      expect(updated.defaultProjectRole).toBe('DEPLOYER');
    });

    it('deletes a team', async () => {
      const team = await teamRepo.create({ organisationId: 'org-1', name: 'Temp', defaultProjectRole: 'VIEWER' });
      await teamRepo.delete(team.id);
      expect(await teamRepo.findById(team.id)).toBeNull();
    });
  });

  describe('team members', () => {
    it('adds a member to a team', async () => {
      const member = await memberRepo.add({ teamId: 'team-1', userId: 'user-1', addedBy: 'admin-1' });
      expect(member.teamId).toBe('team-1');
      expect(member.userId).toBe('user-1');
    });

    it('finds members by team', async () => {
      await memberRepo.add({ teamId: 'team-1', userId: 'user-1', addedBy: 'admin-1' });
      await memberRepo.add({ teamId: 'team-1', userId: 'user-2', addedBy: 'admin-1' });
      const members = await memberRepo.findByTeamId('team-1');
      expect(members).toHaveLength(2);
    });

    it('finds teams a user belongs to', async () => {
      await memberRepo.add({ teamId: 'team-1', userId: 'user-1', addedBy: 'admin-1' });
      await memberRepo.add({ teamId: 'team-2', userId: 'user-1', addedBy: 'admin-1' });
      const memberships = await memberRepo.findByUserId('user-1');
      expect(memberships).toHaveLength(2);
    });

    it('removes a member', async () => {
      await memberRepo.add({ teamId: 'team-1', userId: 'user-1', addedBy: 'admin-1' });
      await memberRepo.remove('team-1', 'user-1');
      expect(await memberRepo.findByTeamId('team-1')).toHaveLength(0);
    });

    it('removes all members of a user (cascade)', async () => {
      await memberRepo.add({ teamId: 'team-1', userId: 'user-1', addedBy: 'admin-1' });
      await memberRepo.add({ teamId: 'team-2', userId: 'user-1', addedBy: 'admin-1' });
      await memberRepo.removeAllForUser('user-1');
      expect(await memberRepo.findByUserId('user-1')).toHaveLength(0);
    });
  });
});
```

- [ ] **Step 2: Run test — fails (module not found)**

Run: `npx jest --config jest.config.unified.js tests/store/tinybase/team.tinybase.test.ts`

- [ ] **Step 3: Write repository interface**

Create `src/lib/store/repositories/team.repository.ts`:

```typescript
import type { Team, TeamMember, ProjectRole } from '../types';

export interface CreateTeamData {
  organisationId: string;
  name: string;
  description?: string;
  defaultProjectRole: ProjectRole;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  defaultProjectRole?: ProjectRole;
}

export interface AddTeamMemberData {
  teamId: string;
  userId: string;
  addedBy: string;
}

export interface ITeamRepository {
  create(data: CreateTeamData): Promise<Team>;
  findById(id: string): Promise<Team | null>;
  findByOrgId(organisationId: string): Promise<Team[]>;
  findByNameAndOrg(name: string, organisationId: string): Promise<Team | null>;
  update(id: string, data: UpdateTeamData): Promise<Team>;
  delete(id: string): Promise<void>;
}

export interface ITeamMemberRepository {
  add(data: AddTeamMemberData): Promise<TeamMember>;
  findByTeamId(teamId: string): Promise<TeamMember[]>;
  findByUserId(userId: string): Promise<TeamMember[]>;
  findByTeamAndUser(teamId: string, userId: string): Promise<TeamMember | null>;
  remove(teamId: string, userId: string): Promise<void>;
  removeAllForUser(userId: string): Promise<void>;
  removeAllForTeam(teamId: string): Promise<void>;
}
```

- [ ] **Step 4: Write TinyBase implementation**

Create `src/lib/store/tinybase/team.tinybase.ts`:

```typescript
import type { Store } from 'tinybase';
import type { Team, TeamMember, ProjectRole } from '../types';
import type { ITeamRepository, ITeamMemberRepository, CreateTeamData, UpdateTeamData, AddTeamMemberData } from '../repositories/team.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TEAM_TABLE = 'teams';
const MEMBER_TABLE = 'team-members';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToTeam(id: string, row: Record<string, any>): Team {
  return {
    id,
    organisationId: row.organisationId as string,
    name: row.name as string,
    description: (row.description as string) || null,
    defaultProjectRole: row.defaultProjectRole as ProjectRole,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

function rowToMember(id: string, row: Record<string, any>): TeamMember {
  return {
    id,
    teamId: row.teamId as string,
    userId: row.userId as string,
    addedAt: new Date(row.addedAt as string),
    addedBy: row.addedBy as string,
  };
}

export class TinyBaseTeamRepository implements ITeamRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: CreateTeamData): Promise<Team> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TEAM_TABLE, id, {
      organisationId: data.organisationId,
      name: data.name,
      description: data.description ?? '',
      defaultProjectRole: data.defaultProjectRole,
      createdAt: now,
      updatedAt: now,
    });

    return rowToTeam(id, this.store.getRow(TEAM_TABLE, id));
  }

  async findById(id: string): Promise<Team | null> {
    const row = this.store.getRow(TEAM_TABLE, id);
    if (!row.name) return null;
    return rowToTeam(id, row);
  }

  async findByOrgId(organisationId: string): Promise<Team[]> {
    const results: Team[] = [];
    const rowIds = this.persister
      ? this.persister.lookupIndex(TEAM_TABLE, 'organisationId', organisationId)
      : this.store.getRowIds(TEAM_TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(TEAM_TABLE, id);
      if (!this.persister && row.organisationId !== organisationId) continue;
      if (row.name) results.push(rowToTeam(id, row));
    }
    results.sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }

  async findByNameAndOrg(name: string, organisationId: string): Promise<Team | null> {
    const teams = await this.findByOrgId(organisationId);
    return teams.find(t => t.name === name) ?? null;
  }

  async update(id: string, data: UpdateTeamData): Promise<Team> {
    const row = this.store.getRow(TEAM_TABLE, id);
    if (!row.name) throw new Error(`Team ${id} not found`);

    if (data.name !== undefined) this.store.setCell(TEAM_TABLE, id, 'name', data.name);
    if (data.description !== undefined) this.store.setCell(TEAM_TABLE, id, 'description', data.description ?? '');
    if (data.defaultProjectRole !== undefined) this.store.setCell(TEAM_TABLE, id, 'defaultProjectRole', data.defaultProjectRole);
    this.store.setCell(TEAM_TABLE, id, 'updatedAt', new Date().toISOString());

    return rowToTeam(id, this.store.getRow(TEAM_TABLE, id));
  }

  async delete(id: string): Promise<void> {
    this.store.delRow(TEAM_TABLE, id);
  }
}

export class TinyBaseTeamMemberRepository implements ITeamMemberRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async add(data: AddTeamMemberData): Promise<TeamMember> {
    const existing = await this.findByTeamAndUser(data.teamId, data.userId);
    if (existing) return existing;

    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(MEMBER_TABLE, id, {
      teamId: data.teamId,
      userId: data.userId,
      addedAt: now,
      addedBy: data.addedBy,
    });

    return rowToMember(id, this.store.getRow(MEMBER_TABLE, id));
  }

  async findByTeamId(teamId: string): Promise<TeamMember[]> {
    const results: TeamMember[] = [];
    const rowIds = this.persister
      ? this.persister.lookupIndex(MEMBER_TABLE, 'teamId', teamId)
      : this.store.getRowIds(MEMBER_TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (!this.persister && row.teamId !== teamId) continue;
      if (row.userId) results.push(rowToMember(id, row));
    }
    return results;
  }

  async findByUserId(userId: string): Promise<TeamMember[]> {
    const results: TeamMember[] = [];
    const rowIds = this.persister
      ? this.persister.lookupIndex(MEMBER_TABLE, 'userId', userId)
      : this.store.getRowIds(MEMBER_TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (!this.persister && row.userId !== userId) continue;
      if (row.teamId) results.push(rowToMember(id, row));
    }
    return results;
  }

  async findByTeamAndUser(teamId: string, userId: string): Promise<TeamMember | null> {
    for (const id of this.store.getRowIds(MEMBER_TABLE)) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (row.teamId === teamId && row.userId === userId) return rowToMember(id, row);
    }
    return null;
  }

  async remove(teamId: string, userId: string): Promise<void> {
    for (const id of this.store.getRowIds(MEMBER_TABLE)) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (row.teamId === teamId && row.userId === userId) {
        this.store.delRow(MEMBER_TABLE, id);
        return;
      }
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    const toDelete: string[] = [];
    for (const id of this.store.getRowIds(MEMBER_TABLE)) {
      if (this.store.getRow(MEMBER_TABLE, id).userId === userId) toDelete.push(id);
    }
    for (const id of toDelete) this.store.delRow(MEMBER_TABLE, id);
  }

  async removeAllForTeam(teamId: string): Promise<void> {
    const toDelete: string[] = [];
    for (const id of this.store.getRowIds(MEMBER_TABLE)) {
      if (this.store.getRow(MEMBER_TABLE, id).teamId === teamId) toDelete.push(id);
    }
    for (const id of toDelete) this.store.delRow(MEMBER_TABLE, id);
  }
}
```

- [ ] **Step 5: Run tests — should pass**

Run: `npx jest --config jest.config.unified.js tests/store/tinybase/team.tinybase.test.ts`
Expected: 9 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/store/repositories/team.repository.ts \
        src/lib/store/tinybase/team.tinybase.ts \
        tests/store/tinybase/team.tinybase.test.ts
git commit -m "feat(store): add Team + TeamMember repositories with tests"
```

---

## Task 4: ProjectAccess repository

**Files:**
- Create: `src/lib/store/repositories/project-access.repository.ts`
- Create: `src/lib/store/tinybase/project-access.tinybase.ts`
- Create: `tests/store/tinybase/project-access.tinybase.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { createStore } from 'tinybase';
import { TinyBaseProjectAccessRepository } from '@/lib/store/tinybase/project-access.tinybase';

describe('TinyBaseProjectAccessRepository', () => {
  let store: ReturnType<typeof createStore>;
  let repo: TinyBaseProjectAccessRepository;

  beforeEach(() => {
    store = createStore();
    repo = new TinyBaseProjectAccessRepository(store);
  });

  it('grants team access to project with role', async () => {
    const access = await repo.grant({
      projectId: 'proj-1',
      teamId: 'team-1',
      role: 'DEVELOPER',
      grantedBy: 'admin-1',
    });
    expect(access.role).toBe('DEVELOPER');
  });

  it('finds access by project', async () => {
    await repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'DEVELOPER', grantedBy: 'admin-1' });
    await repo.grant({ projectId: 'proj-1', teamId: 'team-2', role: 'VIEWER', grantedBy: 'admin-1' });
    const rows = await repo.findByProjectId('proj-1');
    expect(rows).toHaveLength(2);
  });

  it('finds access by team', async () => {
    await repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'DEVELOPER', grantedBy: 'admin-1' });
    await repo.grant({ projectId: 'proj-2', teamId: 'team-1', role: 'DEPLOYER', grantedBy: 'admin-1' });
    const rows = await repo.findByTeamId('team-1');
    expect(rows).toHaveLength(2);
  });

  it('updates role', async () => {
    const access = await repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'VIEWER', grantedBy: 'admin-1' });
    const updated = await repo.updateRole(access.id, 'ADMIN');
    expect(updated.role).toBe('ADMIN');
  });

  it('revokes access', async () => {
    const access = await repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'DEVELOPER', grantedBy: 'admin-1' });
    await repo.revoke(access.id);
    expect(await repo.findByProjectId('proj-1')).toHaveLength(0);
  });

  it('revokes all access for a team (cascade)', async () => {
    await repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'DEVELOPER', grantedBy: 'admin-1' });
    await repo.grant({ projectId: 'proj-2', teamId: 'team-1', role: 'DEPLOYER', grantedBy: 'admin-1' });
    await repo.revokeAllForTeam('team-1');
    expect(await repo.findByTeamId('team-1')).toHaveLength(0);
  });

  it('prevents duplicate grant (same team+project)', async () => {
    await repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'DEVELOPER', grantedBy: 'admin-1' });
    await expect(repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'ADMIN', grantedBy: 'admin-1' }))
      .rejects.toThrow('already has access');
  });
});
```

- [ ] **Step 2: Run test — fails**

- [ ] **Step 3: Write repository interface**

Create `src/lib/store/repositories/project-access.repository.ts`:

```typescript
import type { ProjectAccess, ProjectRole } from '../types';

export interface GrantProjectAccessData {
  projectId: string;
  teamId: string;
  role: ProjectRole;
  grantedBy: string;
}

export interface IProjectAccessRepository {
  grant(data: GrantProjectAccessData): Promise<ProjectAccess>;
  findById(id: string): Promise<ProjectAccess | null>;
  findByProjectId(projectId: string): Promise<ProjectAccess[]>;
  findByTeamId(teamId: string): Promise<ProjectAccess[]>;
  findByProjectAndTeam(projectId: string, teamId: string): Promise<ProjectAccess | null>;
  updateRole(id: string, role: ProjectRole): Promise<ProjectAccess>;
  revoke(id: string): Promise<void>;
  revokeAllForTeam(teamId: string): Promise<void>;
  revokeAllForProject(projectId: string): Promise<void>;
}
```

- [ ] **Step 4: Write TinyBase implementation**

Create `src/lib/store/tinybase/project-access.tinybase.ts`:

```typescript
import type { Store } from 'tinybase';
import type { ProjectAccess, ProjectRole } from '../types';
import type { IProjectAccessRepository, GrantProjectAccessData } from '../repositories/project-access.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TABLE = 'project-access';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToAccess(id: string, row: Record<string, any>): ProjectAccess {
  return {
    id,
    projectId: row.projectId as string,
    teamId: row.teamId as string,
    role: row.role as ProjectRole,
    grantedAt: new Date(row.grantedAt as string),
    grantedBy: row.grantedBy as string,
  };
}

export class TinyBaseProjectAccessRepository implements IProjectAccessRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async grant(data: GrantProjectAccessData): Promise<ProjectAccess> {
    const existing = await this.findByProjectAndTeam(data.projectId, data.teamId);
    if (existing) throw new Error(`Team already has access to this project. Use updateRole() instead.`);

    const id = generateId();
    this.store.setRow(TABLE, id, {
      projectId: data.projectId,
      teamId: data.teamId,
      role: data.role,
      grantedAt: new Date().toISOString(),
      grantedBy: data.grantedBy,
    });

    return rowToAccess(id, this.store.getRow(TABLE, id));
  }

  async findById(id: string): Promise<ProjectAccess | null> {
    const row = this.store.getRow(TABLE, id);
    if (!row.projectId) return null;
    return rowToAccess(id, row);
  }

  async findByProjectId(projectId: string): Promise<ProjectAccess[]> {
    const results: ProjectAccess[] = [];
    const rowIds = this.persister
      ? this.persister.lookupIndex(TABLE, 'projectId', projectId)
      : this.store.getRowIds(TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.projectId !== projectId) continue;
      if (row.teamId) results.push(rowToAccess(id, row));
    }
    return results;
  }

  async findByTeamId(teamId: string): Promise<ProjectAccess[]> {
    const results: ProjectAccess[] = [];
    const rowIds = this.persister
      ? this.persister.lookupIndex(TABLE, 'teamId', teamId)
      : this.store.getRowIds(TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.teamId !== teamId) continue;
      if (row.projectId) results.push(rowToAccess(id, row));
    }
    return results;
  }

  async findByProjectAndTeam(projectId: string, teamId: string): Promise<ProjectAccess | null> {
    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.projectId === projectId && row.teamId === teamId) return rowToAccess(id, row);
    }
    return null;
  }

  async updateRole(id: string, role: ProjectRole): Promise<ProjectAccess> {
    const row = this.store.getRow(TABLE, id);
    if (!row.projectId) throw new Error(`ProjectAccess ${id} not found`);
    this.store.setCell(TABLE, id, 'role', role);
    return rowToAccess(id, this.store.getRow(TABLE, id));
  }

  async revoke(id: string): Promise<void> {
    this.store.delRow(TABLE, id);
  }

  async revokeAllForTeam(teamId: string): Promise<void> {
    const toDelete: string[] = [];
    for (const id of this.store.getRowIds(TABLE)) {
      if (this.store.getRow(TABLE, id).teamId === teamId) toDelete.push(id);
    }
    for (const id of toDelete) this.store.delRow(TABLE, id);
  }

  async revokeAllForProject(projectId: string): Promise<void> {
    const toDelete: string[] = [];
    for (const id of this.store.getRowIds(TABLE)) {
      if (this.store.getRow(TABLE, id).projectId === projectId) toDelete.push(id);
    }
    for (const id of toDelete) this.store.delRow(TABLE, id);
  }
}
```

- [ ] **Step 5: Run tests — should pass**

Run: `npx jest --config jest.config.unified.js tests/store/tinybase/project-access.tinybase.test.ts`
Expected: 7 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/store/repositories/project-access.repository.ts \
        src/lib/store/tinybase/project-access.tinybase.ts \
        tests/store/tinybase/project-access.tinybase.test.ts
git commit -m "feat(store): add ProjectAccess repository with tests"
```

---

## Task 5: Wire everything into DataStore

**Files:**
- Modify: `src/lib/store/data-store.ts`
- Modify: `src/lib/store/repositories/index.ts`
- Modify: `src/lib/store/index.ts`
- Modify: `tests/services/helpers.ts`

- [ ] **Step 1: Add TABLE_CONFIG entries in data-store.ts**

Add to the `TABLE_CONFIG` array:

```typescript
  { tableName: 'namespaces', indexes: [{ name: 'slug', cellId: 'slug' }] },
  { tableName: 'teams', indexes: [{ name: 'organisationId', cellId: 'organisationId' }] },
  { tableName: 'team-members', indexes: [{ name: 'teamId', cellId: 'teamId' }, { name: 'userId', cellId: 'userId' }] },
  { tableName: 'project-access', indexes: [{ name: 'projectId', cellId: 'projectId' }, { name: 'teamId', cellId: 'teamId' }] },
```

- [ ] **Step 2: Add imports and DataStore fields**

Add imports at top of `data-store.ts`:

```typescript
import type { ITeamRepository, ITeamMemberRepository } from './repositories/team.repository';
import type { IProjectAccessRepository } from './repositories/project-access.repository';
import type { INamespaceRepository } from './repositories/namespace.repository';
import { TinyBaseTeamRepository, TinyBaseTeamMemberRepository } from './tinybase/team.tinybase';
import { TinyBaseProjectAccessRepository } from './tinybase/project-access.tinybase';
import { TinyBaseNamespaceRepository } from './tinybase/namespace.tinybase';
```

Add to `DataStore` interface:

```typescript
  namespaces: INamespaceRepository;
  teams: ITeamRepository;
  teamMembers: ITeamMemberRepository;
  projectAccess: IProjectAccessRepository;
```

Add to `createDataStore()` return:

```typescript
    namespaces: new TinyBaseNamespaceRepository(tinyStore, persister),
    teams: new TinyBaseTeamRepository(tinyStore, persister),
    teamMembers: new TinyBaseTeamMemberRepository(tinyStore, persister),
    projectAccess: new TinyBaseProjectAccessRepository(tinyStore, persister),
```

- [ ] **Step 3: Update repositories/index.ts exports**

```typescript
export type { ITeamRepository, ITeamMemberRepository, CreateTeamData, UpdateTeamData, AddTeamMemberData } from './team.repository';
export type { IProjectAccessRepository, GrantProjectAccessData } from './project-access.repository';
export type { INamespaceRepository, RegisterNamespaceData } from './namespace.repository';
```

- [ ] **Step 4: Update store/index.ts type exports**

Add to exports:

```typescript
  ITeamRepository,
  ITeamMemberRepository,
  CreateTeamData,
  UpdateTeamData,
  AddTeamMemberData,
  IProjectAccessRepository,
  GrantProjectAccessData,
  INamespaceRepository,
  RegisterNamespaceData,
```

- [ ] **Step 5: Update tests/services/helpers.ts**

Add imports:

```typescript
import { TinyBaseTeamRepository, TinyBaseTeamMemberRepository } from '@/lib/store/tinybase/team.tinybase';
import { TinyBaseProjectAccessRepository } from '@/lib/store/tinybase/project-access.tinybase';
import { TinyBaseNamespaceRepository } from '@/lib/store/tinybase/namespace.tinybase';
```

Add to `createTestStore()` return:

```typescript
    namespaces: new TinyBaseNamespaceRepository(store),
    teams: new TinyBaseTeamRepository(store),
    teamMembers: new TinyBaseTeamMemberRepository(store),
    projectAccess: new TinyBaseProjectAccessRepository(store),
```

- [ ] **Step 6: Run ALL store + service tests**

Run: `npx jest --config jest.config.unified.js tests/store tests/services`
Expected: All existing + new tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/store/data-store.ts src/lib/store/repositories/index.ts \
        src/lib/store/index.ts tests/services/helpers.ts
git commit -m "feat(store): wire Namespace, Team, TeamMember, ProjectAccess into DataStore"
```

---

## Task 6: Permission resolver

**Files:**
- Modify: `src/lib/permissions.ts`
- Create: `tests/services/permissions.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { createTestStore } from './helpers';
import { resolveProjectPermissions } from '@/lib/permissions';
import type { DataStore } from '@/lib/store';
import { setStore } from '@/lib/store';

describe('resolveProjectPermissions', () => {
  let store: DataStore;

  beforeEach(() => {
    store = createTestStore();
    setStore(store);
  });

  it('returns ADMIN for org OWNER on any org project', async () => {
    const org = await store.organisations.create({ name: 'test-org', ownerId: 'owner-1' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });
    await store.organisationMembers.create({ userId: 'owner-1', organisationId: org.id, role: 'OWNER' });

    const result = await resolveProjectPermissions('owner-1', project.id);
    expect(result).toBe('ADMIN');
  });

  it('returns ADMIN for org ADMIN on any org project', async () => {
    const org = await store.organisations.create({ name: 'test-org', ownerId: 'owner-1' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });
    await store.organisationMembers.create({ userId: 'admin-1', organisationId: org.id, role: 'ADMIN' });

    const result = await resolveProjectPermissions('admin-1', project.id);
    expect(result).toBe('ADMIN');
  });

  it('returns team role for org MEMBER via team grant', async () => {
    const org = await store.organisations.create({ name: 'test-org', ownerId: 'owner-1' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });
    await store.organisationMembers.create({ userId: 'member-1', organisationId: org.id, role: 'MEMBER' });

    const team = await store.teams.create({ organisationId: org.id, name: 'Backend', defaultProjectRole: 'DEVELOPER' });
    await store.teamMembers.add({ teamId: team.id, userId: 'member-1', addedBy: 'owner-1' });
    await store.projectAccess.grant({ projectId: project.id, teamId: team.id, role: 'DEVELOPER', grantedBy: 'owner-1' });

    const result = await resolveProjectPermissions('member-1', project.id);
    expect(result).toBe('DEVELOPER');
  });

  it('returns highest role when user is in multiple teams', async () => {
    const org = await store.organisations.create({ name: 'test-org', ownerId: 'owner-1' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });
    await store.organisationMembers.create({ userId: 'member-1', organisationId: org.id, role: 'MEMBER' });

    const teamA = await store.teams.create({ organisationId: org.id, name: 'A', defaultProjectRole: 'VIEWER' });
    const teamB = await store.teams.create({ organisationId: org.id, name: 'B', defaultProjectRole: 'DEPLOYER' });
    await store.teamMembers.add({ teamId: teamA.id, userId: 'member-1', addedBy: 'owner-1' });
    await store.teamMembers.add({ teamId: teamB.id, userId: 'member-1', addedBy: 'owner-1' });
    await store.projectAccess.grant({ projectId: project.id, teamId: teamA.id, role: 'VIEWER', grantedBy: 'owner-1' });
    await store.projectAccess.grant({ projectId: project.id, teamId: teamB.id, role: 'DEPLOYER', grantedBy: 'owner-1' });

    const result = await resolveProjectPermissions('member-1', project.id);
    expect(result).toBe('DEPLOYER');
  });

  it('returns null for org MEMBER with no team grant', async () => {
    const org = await store.organisations.create({ name: 'test-org', ownerId: 'owner-1' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });
    await store.organisationMembers.create({ userId: 'member-1', organisationId: org.id, role: 'MEMBER' });

    const result = await resolveProjectPermissions('member-1', project.id);
    expect(result).toBeNull();
  });

  it('returns null for non-member user', async () => {
    const org = await store.organisations.create({ name: 'test-org', ownerId: 'owner-1' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });

    const result = await resolveProjectPermissions('stranger-1', project.id);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — fails**

- [ ] **Step 3: Implement resolveProjectPermissions**

Add to `src/lib/permissions.ts`:

```typescript
import type { ProjectRole } from '@/lib/store';

const ROLE_RANK: Record<ProjectRole, number> = {
  VIEWER: 0,
  DEVELOPER: 1,
  DEPLOYER: 2,
  ADMIN: 3,
};

export async function resolveProjectPermissions(
  userId: string,
  projectId: string,
): Promise<ProjectRole | null> {
  const { getStoreAsync } = await import('@/lib/store');
  const store = await getStoreAsync();

  const project = await store.projects.findById(projectId);
  if (!project) return null;

  // Org-owned project: check tiered auto-admin (D3)
  if (project.organisationId) {
    const membership = await store.organisationMembers.findByUserAndOrg(userId, project.organisationId);
    if (membership && (membership.role === 'OWNER' || membership.role === 'ADMIN')) {
      return 'ADMIN';
    }

    // Team grants
    const teamMemberships = await store.teamMembers.findByUserId(userId);
    const projectAccessRows = await store.projectAccess.findByProjectId(projectId);

    const userTeamIds = new Set(teamMemberships.map(tm => tm.teamId));

    let highestRole: ProjectRole | null = null;
    for (const access of projectAccessRows) {
      if (userTeamIds.has(access.teamId)) {
        if (!highestRole || ROLE_RANK[access.role] > ROLE_RANK[highestRole]) {
          highestRole = access.role;
        }
      }
    }

    return highestRole;
  }

  return null;
}
```

- [ ] **Step 4: Run tests — should pass**

Run: `npx jest --config jest.config.unified.js tests/services/permissions.test.ts`
Expected: 6 tests PASS

- [ ] **Step 5: Run ALL tests**

Run: `npx jest --config jest.config.unified.js tests/store tests/services`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/permissions.ts tests/services/permissions.test.ts
git commit -m "feat(permissions): add resolveProjectPermissions — tiered auto-admin + team grants"
```

---

## Task 7: Update existing Organisation + Project TinyBase impls for new fields

**Files:**
- Modify: `src/lib/store/tinybase/organisation.tinybase.ts`
- Modify: `src/lib/store/tinybase/project.tinybase.ts`
- Modify: `src/lib/store/tinybase/user.tinybase.ts`

This task adds the `slug`, `visibility`, and `ownerType`/`ownerId` fields to the existing repositories. The fields are optional initially (empty string defaults) so existing data continues to work. Migration (backfilling slugs) is a separate step.

- [ ] **Step 1: Add slug + visibility to Organisation rowToOrg + create**

In `organisation.tinybase.ts`, add to `rowToOrg()`:
```typescript
    slug: (row.slug as string) || row.name as string,
    visibility: (row.visibility as Visibility) || 'PUBLIC',
    defaultProjectVisibility: (row.defaultProjectVisibility as Visibility) || 'PRIVATE',
```

In `create()`, add to `setRow`:
```typescript
      slug: data.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      visibility: 'PUBLIC',
      defaultProjectVisibility: 'PRIVATE',
```

- [ ] **Step 2: Add slug + visibility + ownerType to Project rowToProject + create**

In `project.tinybase.ts`, add to `rowToProject()`:
```typescript
    slug: (row.slug as string) || row.name as string,
    ownerType: (row.ownerType as ProjectOwnerType) || 'ORGANISATION',
    ownerId: (row.ownerId as string) || row.organisationId as string,
    visibility: (row.visibility as Visibility) || 'PRIVATE',
```

In `create()`, add to `setRow`:
```typescript
      slug: data.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      ownerType: 'ORGANISATION',
      ownerId: data.organisationId,
      visibility: 'PRIVATE',
```

- [ ] **Step 3: Add slug to User rowToUser + create**

In `user.tinybase.ts`, add to `rowToUser()`:
```typescript
    slug: (row.slug as string) || '',
```

In `create()`, add to `setRow`:
```typescript
      slug: data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-'),
```

- [ ] **Step 4: Run all store tests**

Run: `npx jest --config jest.config.unified.js tests/store`
Expected: All PASS (existing tests + new tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/tinybase/organisation.tinybase.ts \
        src/lib/store/tinybase/project.tinybase.ts \
        src/lib/store/tinybase/user.tinybase.ts
git commit -m "feat(store): add slug, visibility, ownerType fields to existing entities"
```

---

## Summary

After completing all 7 tasks, the data layer is ready:

| Entity | Status |
|---|---|
| Namespace (global slug registry) | ✅ Repository + tests |
| Team + TeamMember | ✅ Repository + tests |
| ProjectAccess | ✅ Repository + tests |
| Organisation (slug, visibility) | ✅ Updated |
| Project (slug, visibility, ownerType) | ✅ Updated |
| User (slug) | ✅ Updated |
| Permission resolver | ✅ resolveProjectPermissions + tests |
| DataStore wiring | ✅ All repos wired |

**Next plan (B):** Team CRUD pages, Project access management pages, team creation on org create.

**Next plan (C):** Flat URL routing (`/{slug}/{project}`), personal projects UI, middleware update.
