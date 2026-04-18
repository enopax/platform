import { createTestStore } from './helpers';
import { resolveProjectPermissions } from '@/lib/permissions';
import { seedBuiltInRoles } from '@/lib/seed-roles';
import type { DataStore } from '@/lib/store';
import { setStore } from '@/lib/store';

let store: DataStore;

beforeEach(() => {
  store = createTestStore();
  setStore(store);
});

describe('E2E: Team → Project Access → Permissions', () => {
  it('full flow: create org, team, project, grant access, verify member permissions', async () => {
    const owner = await store.users.create({ email: 'owner@acme.com', name: 'Owner', slug: 'owner' });
    const dev = await store.users.create({ email: 'dev@acme.com', name: 'Dev', slug: 'dev' });

    const org = await store.organisations.create({ name: 'Acme', ownerId: owner.id });
    await store.organisationMembers.create({ userId: owner.id, organisationId: org.id, role: 'OWNER' });
    await store.organisationMembers.create({ userId: dev.id, organisationId: org.id, role: 'MEMBER' });

    const project = await store.projects.create({ name: 'api', organisationId: org.id });

    const team = await store.teams.create({ organisationId: org.id, name: 'Backend', defaultProjectRole: 'DEVELOPER' });
    await store.teamMembers.add({ teamId: team.id, userId: dev.id, addedBy: owner.id });
    await store.projectAccess.grant({ projectId: project.id, teamId: team.id, role: 'DEVELOPER', grantedBy: owner.id });

    expect(await resolveProjectPermissions(owner.id, project.id)).toBe('ADMIN');
    expect(await resolveProjectPermissions(dev.id, project.id)).toBe('DEVELOPER');
  });

  it('member in multiple teams gets highest role', async () => {
    const owner = await store.users.create({ email: 'owner@x.com', name: 'Owner', slug: 'owner' });
    const alice = await store.users.create({ email: 'alice@x.com', name: 'Alice', slug: 'alice' });

    const org = await store.organisations.create({ name: 'X', ownerId: owner.id });
    await store.organisationMembers.create({ userId: owner.id, organisationId: org.id, role: 'OWNER' });
    await store.organisationMembers.create({ userId: alice.id, organisationId: org.id, role: 'MEMBER' });

    const project = await store.projects.create({ name: 'app', organisationId: org.id });

    const viewers = await store.teams.create({ organisationId: org.id, name: 'Viewers', defaultProjectRole: 'VIEWER' });
    const deployers = await store.teams.create({ organisationId: org.id, name: 'Ops', defaultProjectRole: 'DEPLOYER' });
    await store.teamMembers.add({ teamId: viewers.id, userId: alice.id, addedBy: owner.id });
    await store.teamMembers.add({ teamId: deployers.id, userId: alice.id, addedBy: owner.id });
    await store.projectAccess.grant({ projectId: project.id, teamId: viewers.id, role: 'VIEWER', grantedBy: owner.id });
    await store.projectAccess.grant({ projectId: project.id, teamId: deployers.id, role: 'DEPLOYER', grantedBy: owner.id });

    expect(await resolveProjectPermissions(alice.id, project.id)).toBe('DEPLOYER');
  });

  it('member without team access has no project permissions', async () => {
    const owner = await store.users.create({ email: 'o@x.com', name: 'O', slug: 'o' });
    const bob = await store.users.create({ email: 'b@x.com', name: 'B', slug: 'b' });

    const org = await store.organisations.create({ name: 'X', ownerId: owner.id });
    await store.organisationMembers.create({ userId: bob.id, organisationId: org.id, role: 'MEMBER' });

    const project = await store.projects.create({ name: 'secret', organisationId: org.id });

    expect(await resolveProjectPermissions(bob.id, project.id)).toBeNull();
  });
});

describe('E2E: Cross-Org Sharing', () => {
  it('full flow: share project, accept, grant cross-org team, verify permissions', async () => {
    const ownerA = await store.users.create({ email: 'a@orgA.com', name: 'OwnerA', slug: 'ownera' });
    const ownerB = await store.users.create({ email: 'b@orgB.com', name: 'OwnerB', slug: 'ownerb' });
    const devB = await store.users.create({ email: 'dev@orgB.com', name: 'DevB', slug: 'devb' });

    const orgA = await store.organisations.create({ name: 'OrgA', ownerId: ownerA.id });
    const orgB = await store.organisations.create({ name: 'OrgB', ownerId: ownerB.id });
    await store.organisationMembers.create({ userId: ownerA.id, organisationId: orgA.id, role: 'OWNER' });
    await store.organisationMembers.create({ userId: ownerB.id, organisationId: orgB.id, role: 'OWNER' });
    await store.organisationMembers.create({ userId: devB.id, organisationId: orgB.id, role: 'MEMBER' });

    const project = await store.projects.create({ name: 'shared-proj', organisationId: orgA.id });

    const share = await store.projectShares.create({
      projectId: project.id,
      sharedWithType: 'ORGANISATION',
      sharedWithId: orgB.id,
      permission: 'CONTRIBUTE',
      sharedBy: ownerA.id,
    });
    expect(share.status).toBe('INVITED');

    await store.projectShares.updateStatus(share.id, 'ACTIVE');

    const teamB = await store.teams.create({ organisationId: orgB.id, name: 'Dev', defaultProjectRole: 'DEVELOPER' });
    await store.teamMembers.add({ teamId: teamB.id, userId: devB.id, addedBy: ownerB.id });
    await store.projectAccess.grant({ projectId: project.id, teamId: teamB.id, role: 'DEVELOPER', grantedBy: ownerA.id });

    expect(await resolveProjectPermissions(devB.id, project.id)).toBe('DEVELOPER');
    expect(await resolveProjectPermissions(ownerA.id, project.id)).toBe('ADMIN');
    expect(await resolveProjectPermissions(ownerB.id, project.id)).toBeNull();
  });

  it('shared projects appear in findSharedWithEntity', async () => {
    const ownerA = await store.users.create({ email: 'a@a.com', name: 'A', slug: 'a' });
    const orgA = await store.organisations.create({ name: 'A', ownerId: ownerA.id });
    const orgB = await store.organisations.create({ name: 'B', ownerId: ownerA.id });

    const proj1 = await store.projects.create({ name: 'p1', organisationId: orgA.id });
    const proj2 = await store.projects.create({ name: 'p2', organisationId: orgA.id });

    await store.projectShares.create({ projectId: proj1.id, sharedWithType: 'ORGANISATION', sharedWithId: orgB.id, permission: 'VIEW', sharedBy: ownerA.id });
    const s2 = await store.projectShares.create({ projectId: proj2.id, sharedWithType: 'ORGANISATION', sharedWithId: orgB.id, permission: 'CONTRIBUTE', sharedBy: ownerA.id });
    await store.projectShares.updateStatus(s2.id, 'ACTIVE');

    const allShared = await store.projectShares.findSharedWithEntity('ORGANISATION', orgB.id);
    expect(allShared).toHaveLength(2);

    const activeOnly = await store.projectShares.findSharedWithEntity('ORGANISATION', orgB.id, 'ACTIVE');
    expect(activeOnly).toHaveLength(1);
    expect(activeOnly[0].projectId).toBe(proj2.id);
  });
});

describe('E2E: Custom Project Roles', () => {
  it('full flow: seed built-in roles, create custom role, verify definitions', async () => {
    const owner = await store.users.create({ email: 'o@r.com', name: 'O', slug: 'o' });
    const org = await store.organisations.create({ name: 'Roles', ownerId: owner.id });

    await seedBuiltInRoles(org.id);

    const roles = await store.projectRoles.findByOrgId(org.id);
    expect(roles).toHaveLength(4);

    const viewer = roles.find(r => r.name === 'Viewer');
    expect(viewer).toBeDefined();
    expect(viewer!.isBuiltIn).toBe(true);
    expect(viewer!.permissions).toContain('project:view');
    expect(viewer!.permissions).toContain('resource:view');
    expect(viewer!.permissions).not.toContain('resource:deploy');

    const admin = roles.find(r => r.name === 'Admin');
    expect(admin!.permissions).toContain('access:manage');
    expect(admin!.rank).toBeGreaterThan(viewer!.rank);

    const customRole = await store.projectRoles.create({
      organisationId: org.id,
      name: 'Security Reviewer',
      description: 'Can view resources and access but not modify',
      permissions: ['project:view', 'resource:view', 'access:view'],
      rank: 0,
    });
    expect(customRole.isBuiltIn).toBe(false);

    const allRoles = await store.projectRoles.findByOrgId(org.id);
    expect(allRoles).toHaveLength(5);
  });

  it('seeding is idempotent — calling twice does not duplicate', async () => {
    const owner = await store.users.create({ email: 'o@i.com', name: 'O', slug: 'o' });
    const org = await store.organisations.create({ name: 'Idem', ownerId: owner.id });

    await seedBuiltInRoles(org.id);
    await seedBuiltInRoles(org.id);

    const roles = await store.projectRoles.findByOrgId(org.id);
    expect(roles).toHaveLength(4);
  });
});

describe('E2E: Namespace + Slug', () => {
  it('register user slug → namespace resolves → no duplicate allowed', async () => {
    const user = await store.users.create({ email: 'felix@test.com', name: 'Felix', slug: 'felixboehm' });
    await store.namespaces.register({ slug: 'felixboehm', entityType: 'USER', entityId: user.id });

    const ns = await store.namespaces.findBySlug('felixboehm');
    expect(ns).not.toBeNull();
    expect(ns!.entityType).toBe('USER');
    expect(ns!.entityId).toBe(user.id);

    await expect(
      store.namespaces.register({ slug: 'felixboehm', entityType: 'ORGANISATION', entityId: 'org-1' })
    ).rejects.toThrow('already taken');
  });

  it('org and user share global namespace — no collision', async () => {
    const user = await store.users.create({ email: 'test@t.com', name: 'Test', slug: 'acme' });
    await store.namespaces.register({ slug: 'acme', entityType: 'USER', entityId: user.id });

    await expect(
      store.namespaces.register({ slug: 'acme', entityType: 'ORGANISATION', entityId: 'org-x' })
    ).rejects.toThrow('already taken');
  });
});

describe('E2E: Project Transfer', () => {
  it('full flow: transfer project, old access revoked, new org owns it', async () => {
    const ownerA = await store.users.create({ email: 'a@t.com', name: 'A', slug: 'a' });
    const devA = await store.users.create({ email: 'dev@t.com', name: 'Dev', slug: 'dev' });

    const orgA = await store.organisations.create({ name: 'Source', ownerId: ownerA.id });
    const orgB = await store.organisations.create({ name: 'Target', ownerId: ownerA.id });
    await store.organisationMembers.create({ userId: ownerA.id, organisationId: orgA.id, role: 'OWNER' });
    await store.organisationMembers.create({ userId: devA.id, organisationId: orgA.id, role: 'MEMBER' });
    await store.organisationMembers.create({ userId: ownerA.id, organisationId: orgB.id, role: 'OWNER' });

    const project = await store.projects.create({ name: 'transfer-me', organisationId: orgA.id });

    const team = await store.teams.create({ organisationId: orgA.id, name: 'Devs', defaultProjectRole: 'DEVELOPER' });
    await store.teamMembers.add({ teamId: team.id, userId: devA.id, addedBy: ownerA.id });
    await store.projectAccess.grant({ projectId: project.id, teamId: team.id, role: 'DEVELOPER', grantedBy: ownerA.id });

    expect(await resolveProjectPermissions(devA.id, project.id)).toBe('DEVELOPER');

    await store.projectAccess.revokeAllForProject(project.id);
    await store.projects.transferToOrg(project.id, orgB.id);

    const transferred = await store.projects.findById(project.id);
    expect(transferred!.organisationId).toBe(orgB.id);

    expect(await resolveProjectPermissions(devA.id, project.id)).toBeNull();
    expect(await resolveProjectPermissions(ownerA.id, project.id)).toBe('ADMIN');
  });
});

describe('E2E: Team Lifecycle', () => {
  it('delete team → cascades access + members', async () => {
    const owner = await store.users.create({ email: 'o@lc.com', name: 'O', slug: 'o' });
    const member = await store.users.create({ email: 'm@lc.com', name: 'M', slug: 'm' });

    const org = await store.organisations.create({ name: 'LC', ownerId: owner.id });
    await store.organisationMembers.create({ userId: member.id, organisationId: org.id, role: 'MEMBER' });

    const project = await store.projects.create({ name: 'p', organisationId: org.id });
    const team = await store.teams.create({ organisationId: org.id, name: 'Temp', defaultProjectRole: 'DEVELOPER' });
    await store.teamMembers.add({ teamId: team.id, userId: member.id, addedBy: owner.id });
    await store.projectAccess.grant({ projectId: project.id, teamId: team.id, role: 'DEVELOPER', grantedBy: owner.id });

    expect(await resolveProjectPermissions(member.id, project.id)).toBe('DEVELOPER');

    await store.teamMembers.removeAllForTeam(team.id);
    await store.projectAccess.revokeAllForTeam(team.id);
    await store.teams.delete(team.id);

    expect(await store.teams.findById(team.id)).toBeNull();
    expect(await store.teamMembers.findByTeamId(team.id)).toHaveLength(0);
    expect(await store.projectAccess.findByTeamId(team.id)).toHaveLength(0);
    expect(await resolveProjectPermissions(member.id, project.id)).toBeNull();
  });

  it('remove org member → cascades team memberships → loses project access', async () => {
    const owner = await store.users.create({ email: 'o@cm.com', name: 'O', slug: 'o' });
    const alice = await store.users.create({ email: 'a@cm.com', name: 'A', slug: 'a' });

    const org = await store.organisations.create({ name: 'CM', ownerId: owner.id });
    await store.organisationMembers.create({ userId: alice.id, organisationId: org.id, role: 'MEMBER' });

    const project = await store.projects.create({ name: 'p', organisationId: org.id });
    const t1 = await store.teams.create({ organisationId: org.id, name: 'T1', defaultProjectRole: 'DEVELOPER' });
    const t2 = await store.teams.create({ organisationId: org.id, name: 'T2', defaultProjectRole: 'VIEWER' });
    await store.teamMembers.add({ teamId: t1.id, userId: alice.id, addedBy: owner.id });
    await store.teamMembers.add({ teamId: t2.id, userId: alice.id, addedBy: owner.id });
    await store.projectAccess.grant({ projectId: project.id, teamId: t1.id, role: 'DEVELOPER', grantedBy: owner.id });

    expect(await resolveProjectPermissions(alice.id, project.id)).toBe('DEVELOPER');

    await store.teamMembers.removeAllForUser(alice.id);
    await store.organisationMembers.delete(alice.id, org.id);

    expect(await store.teamMembers.findByUserId(alice.id)).toHaveLength(0);
    expect(await resolveProjectPermissions(alice.id, project.id)).toBeNull();
  });
});
