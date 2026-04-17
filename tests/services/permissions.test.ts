import { createTestStore } from './helpers';
import { resolveProjectPermissions } from '@/lib/permissions';
import type { DataStore } from '@/lib/store';
import { setStore, resetStore } from '@/lib/store';

describe('resolveProjectPermissions', () => {
  let store: DataStore;

  beforeEach(() => {
    resetStore();
    store = createTestStore();
    setStore(store);
  });

  it('grants ADMIN to org OWNER on any project', async () => {
    const org = await store.organisations.create({ name: 'test-org', ownerId: 'owner-1' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });
    await store.organisationMembers.create({ userId: 'owner-1', organisationId: org.id, role: 'OWNER' });

    const result = await resolveProjectPermissions('owner-1', project.id);
    expect(result).toBe('ADMIN');
  });

  it('grants ADMIN to org ADMIN on any project', async () => {
    const org = await store.organisations.create({ name: 'admin-org', ownerId: 'admin-1' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });
    await store.organisationMembers.create({ userId: 'admin-1', organisationId: org.id, role: 'ADMIN' });

    const result = await resolveProjectPermissions('admin-1', project.id);
    expect(result).toBe('ADMIN');
  });

  it('grants team project role to org MEMBER via team', async () => {
    const org = await store.organisations.create({ name: 'member-org', ownerId: 'owner-x' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });
    await store.organisationMembers.create({ userId: 'member-1', organisationId: org.id, role: 'MEMBER' });
    const team = await store.teams.create({ organisationId: org.id, name: 'dev-team', defaultProjectRole: 'DEVELOPER' });
    await store.teamMembers.add({ teamId: team.id, userId: 'member-1', addedBy: 'owner-x' });
    await store.projectAccess.grant({ projectId: project.id, teamId: team.id, role: 'DEVELOPER', grantedBy: 'owner-x' });

    const result = await resolveProjectPermissions('member-1', project.id);
    expect(result).toBe('DEVELOPER');
  });

  it('returns highest role when user is in multiple teams with different roles', async () => {
    const org = await store.organisations.create({ name: 'multi-org', ownerId: 'owner-y' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });
    await store.organisationMembers.create({ userId: 'member-2', organisationId: org.id, role: 'MEMBER' });

    const teamA = await store.teams.create({ organisationId: org.id, name: 'team-a', defaultProjectRole: 'VIEWER' });
    const teamB = await store.teams.create({ organisationId: org.id, name: 'team-b', defaultProjectRole: 'DEPLOYER' });

    await store.teamMembers.add({ teamId: teamA.id, userId: 'member-2', addedBy: 'owner-y' });
    await store.teamMembers.add({ teamId: teamB.id, userId: 'member-2', addedBy: 'owner-y' });

    await store.projectAccess.grant({ projectId: project.id, teamId: teamA.id, role: 'VIEWER', grantedBy: 'owner-y' });
    await store.projectAccess.grant({ projectId: project.id, teamId: teamB.id, role: 'DEPLOYER', grantedBy: 'owner-y' });

    const result = await resolveProjectPermissions('member-2', project.id);
    expect(result).toBe('DEPLOYER');
  });

  it('returns null for org MEMBER with no team access', async () => {
    const org = await store.organisations.create({ name: 'bare-org', ownerId: 'owner-z' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });
    await store.organisationMembers.create({ userId: 'member-3', organisationId: org.id, role: 'MEMBER' });

    const result = await resolveProjectPermissions('member-3', project.id);
    expect(result).toBeNull();
  });

  it('returns null for user not in org', async () => {
    const org = await store.organisations.create({ name: 'stranger-org', ownerId: 'owner-w' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });

    const result = await resolveProjectPermissions('stranger-999', project.id);
    expect(result).toBeNull();
  });
});
