import { createTestStore } from './helpers';
import { checkOrganisationPermissions, checkProjectPermissions, resolveProjectPermissions } from '@/lib/permissions';
import type { DataStore } from '@/lib/store';
import { setStore, resetStore } from '@/lib/store';

describe('checkOrganisationPermissions', () => {
  let store: DataStore;

  beforeEach(() => {
    resetStore();
    store = createTestStore();
    setStore(store);
  });

  it('grants canManage to OWNER', async () => {
    const org = await store.organisations.create({ name: 'test-org', ownerId: 'owner-1' });
    await store.organisationMembers.create({ userId: 'owner-1', organisationId: org.id, role: 'OWNER' });

    const perms = await checkOrganisationPermissions('owner-1', 'CUSTOMER', org.id);
    expect(perms.isMember).toBe(true);
    expect(perms.isOwner).toBe(true);
    expect(perms.canManage).toBe(true);
  });

  it('grants canManage to ADMIN', async () => {
    const org = await store.organisations.create({ name: 'admin-org', ownerId: 'someone' });
    await store.organisationMembers.create({ userId: 'admin-1', organisationId: org.id, role: 'ADMIN' });

    const perms = await checkOrganisationPermissions('admin-1', 'CUSTOMER', org.id);
    expect(perms.isMember).toBe(true);
    expect(perms.isAdmin).toBe(true);
    expect(perms.canManage).toBe(true);
  });

  it('grants canManage to MANAGER', async () => {
    const org = await store.organisations.create({ name: 'mgr-org', ownerId: 'someone' });
    await store.organisationMembers.create({ userId: 'mgr-1', organisationId: org.id, role: 'MANAGER' });

    const perms = await checkOrganisationPermissions('mgr-1', 'CUSTOMER', org.id);
    expect(perms.isMember).toBe(true);
    expect(perms.isManager).toBe(true);
    expect(perms.canManage).toBe(true);
  });

  it('denies canManage to MEMBER', async () => {
    const org = await store.organisations.create({ name: 'member-org', ownerId: 'someone' });
    await store.organisationMembers.create({ userId: 'member-1', organisationId: org.id, role: 'MEMBER' });

    const perms = await checkOrganisationPermissions('member-1', 'CUSTOMER', org.id);
    expect(perms.isMember).toBe(true);
    expect(perms.canManage).toBe(false);
  });

  it('denies access to non-member', async () => {
    const org = await store.organisations.create({ name: 'closed-org', ownerId: 'someone' });

    const perms = await checkOrganisationPermissions('stranger', 'CUSTOMER', org.id);
    expect(perms.isMember).toBe(false);
    expect(perms.canManage).toBe(false);
  });

  it('SUPERADMIN without membership has no org access', async () => {
    const org = await store.organisations.create({ name: 'sa-org', ownerId: 'someone' });

    const perms = await checkOrganisationPermissions('superadmin-1', 'SUPERADMIN', org.id);
    expect(perms.isMember).toBe(false);
    expect(perms.canManage).toBe(false);
  });

  it('SUPERADMIN with membership uses membership role', async () => {
    const org = await store.organisations.create({ name: 'sa-member-org', ownerId: 'someone' });
    await store.organisationMembers.create({ userId: 'superadmin-1', organisationId: org.id, role: 'MEMBER' });

    const perms = await checkOrganisationPermissions('superadmin-1', 'SUPERADMIN', org.id);
    expect(perms.isMember).toBe(true);
    expect(perms.canManage).toBe(false);
  });
});

describe('checkProjectPermissions', () => {
  let store: DataStore;

  beforeEach(() => {
    resetStore();
    store = createTestStore();
    setStore(store);
  });

  it('grants canManage to org OWNER', async () => {
    const org = await store.organisations.create({ name: 'proj-org', ownerId: 'owner-1' });
    await store.organisationMembers.create({ userId: 'owner-1', organisationId: org.id, role: 'OWNER' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });

    const perms = await checkProjectPermissions('owner-1', 'CUSTOMER', org.id, project.id);
    expect(perms.isMember).toBe(true);
    expect(perms.canManage).toBe(true);
  });

  it('denies canManage to org MEMBER', async () => {
    const org = await store.organisations.create({ name: 'proj-org2', ownerId: 'someone' });
    await store.organisationMembers.create({ userId: 'member-1', organisationId: org.id, role: 'MEMBER' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });

    const perms = await checkProjectPermissions('member-1', 'CUSTOMER', org.id, project.id);
    expect(perms.isMember).toBe(true);
    expect(perms.canManage).toBe(false);
  });

  it('SUPERADMIN without membership has no project access', async () => {
    const org = await store.organisations.create({ name: 'proj-sa-org', ownerId: 'someone' });
    const project = await store.projects.create({ name: 'proj', organisationId: org.id });

    const perms = await checkProjectPermissions('superadmin-1', 'SUPERADMIN', org.id, project.id);
    expect(perms.isMember).toBe(false);
    expect(perms.canManage).toBe(false);
  });
});

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

  it('returns role from cross-org team on shared project', async () => {
    const orgA = await store.organisations.create({ name: 'org-a', ownerId: 'owner-a' });
    const orgB = await store.organisations.create({ name: 'org-b', ownerId: 'owner-b' });

    const project = await store.projects.create({ name: 'shared-proj', organisationId: orgA.id });

    await store.projectShares.create({
      projectId: project.id,
      sharedWithType: 'ORGANISATION',
      sharedWithId: orgB.id,
      permission: 'CONTRIBUTE',
      sharedBy: 'owner-a',
    });

    const teamB = await store.teams.create({ organisationId: orgB.id, name: 'Dev', defaultProjectRole: 'DEVELOPER' });
    await store.teamMembers.add({ teamId: teamB.id, userId: 'user-b', addedBy: 'owner-b' });

    await store.projectAccess.grant({ projectId: project.id, teamId: teamB.id, role: 'DEVELOPER', grantedBy: 'owner-a' });

    const result = await resolveProjectPermissions('user-b', project.id);
    expect(result).toBe('DEVELOPER');
  });
});
