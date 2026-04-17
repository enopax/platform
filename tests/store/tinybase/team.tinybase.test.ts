import { createStore } from 'tinybase';
import { TinyBaseTeamRepository, TinyBaseTeamMemberRepository } from '@/lib/store/tinybase/team.tinybase';

describe('TinyBaseTeamRepository', () => {
  let teamRepo: TinyBaseTeamRepository;
  let memberRepo: TinyBaseTeamMemberRepository;

  beforeEach(() => {
    const store = createStore();
    teamRepo = new TinyBaseTeamRepository(store);
    memberRepo = new TinyBaseTeamMemberRepository(store);
  });

  it('creates a team with defaultProjectRole', async () => {
    const team = await teamRepo.create({
      organisationId: 'org-1',
      name: 'Backend',
      defaultProjectRole: 'DEVELOPER',
    });

    expect(team.id).toBeDefined();
    expect(team.organisationId).toBe('org-1');
    expect(team.name).toBe('Backend');
    expect(team.defaultProjectRole).toBe('DEVELOPER');
    expect(team.description).toBeNull();
    expect(team.createdAt).toBeInstanceOf(Date);
    expect(team.updatedAt).toBeInstanceOf(Date);
  });

  it('finds teams by organisation', async () => {
    await teamRepo.create({ organisationId: 'org-1', name: 'Backend', defaultProjectRole: 'DEVELOPER' });
    await teamRepo.create({ organisationId: 'org-1', name: 'Frontend', defaultProjectRole: 'VIEWER' });
    await teamRepo.create({ organisationId: 'org-2', name: 'Infra', defaultProjectRole: 'ADMIN' });

    const org1Teams = await teamRepo.findByOrgId('org-1');
    expect(org1Teams).toHaveLength(2);

    const org2Teams = await teamRepo.findByOrgId('org-2');
    expect(org2Teams).toHaveLength(1);
  });

  it('updates a team', async () => {
    const team = await teamRepo.create({
      organisationId: 'org-1',
      name: 'Old Name',
      defaultProjectRole: 'VIEWER',
    });

    const updated = await teamRepo.update(team.id, {
      name: 'New Name',
      defaultProjectRole: 'DEPLOYER',
    });

    expect(updated.name).toBe('New Name');
    expect(updated.defaultProjectRole).toBe('DEPLOYER');
    expect(updated.id).toBe(team.id);
  });

  it('deletes a team', async () => {
    const team = await teamRepo.create({
      organisationId: 'org-1',
      name: 'To Delete',
      defaultProjectRole: 'VIEWER',
    });

    await teamRepo.delete(team.id);

    const found = await teamRepo.findById(team.id);
    expect(found).toBeNull();
  });
});

describe('TinyBaseTeamMemberRepository', () => {
  let teamRepo: TinyBaseTeamRepository;
  let memberRepo: TinyBaseTeamMemberRepository;

  beforeEach(() => {
    const store = createStore();
    teamRepo = new TinyBaseTeamRepository(store);
    memberRepo = new TinyBaseTeamMemberRepository(store);
  });

  it('adds a member to a team', async () => {
    const member = await memberRepo.add({
      teamId: 'team-1',
      userId: 'user-1',
      addedBy: 'admin-1',
    });

    expect(member.id).toBeDefined();
    expect(member.teamId).toBe('team-1');
    expect(member.userId).toBe('user-1');
    expect(member.addedBy).toBe('admin-1');
    expect(member.addedAt).toBeInstanceOf(Date);
  });

  it('finds members by team', async () => {
    await memberRepo.add({ teamId: 'team-1', userId: 'user-1', addedBy: 'admin-1' });
    await memberRepo.add({ teamId: 'team-1', userId: 'user-2', addedBy: 'admin-1' });
    await memberRepo.add({ teamId: 'team-2', userId: 'user-3', addedBy: 'admin-1' });

    const team1Members = await memberRepo.findByTeamId('team-1');
    expect(team1Members).toHaveLength(2);
  });

  it('finds teams a user belongs to', async () => {
    await memberRepo.add({ teamId: 'team-1', userId: 'user-1', addedBy: 'admin-1' });
    await memberRepo.add({ teamId: 'team-2', userId: 'user-1', addedBy: 'admin-1' });
    await memberRepo.add({ teamId: 'team-1', userId: 'user-2', addedBy: 'admin-1' });

    const userMemberships = await memberRepo.findByUserId('user-1');
    expect(userMemberships).toHaveLength(2);
  });

  it('removes a member', async () => {
    await memberRepo.add({ teamId: 'team-1', userId: 'user-1', addedBy: 'admin-1' });

    await memberRepo.remove('team-1', 'user-1');

    const members = await memberRepo.findByTeamId('team-1');
    expect(members).toHaveLength(0);
  });

  it('removes all members of a user (cascade)', async () => {
    await memberRepo.add({ teamId: 'team-1', userId: 'user-1', addedBy: 'admin-1' });
    await memberRepo.add({ teamId: 'team-2', userId: 'user-1', addedBy: 'admin-1' });
    await memberRepo.add({ teamId: 'team-1', userId: 'user-2', addedBy: 'admin-1' });

    await memberRepo.removeAllForUser('user-1');

    const remaining = await memberRepo.findByUserId('user-1');
    expect(remaining).toHaveLength(0);

    const team1Members = await memberRepo.findByTeamId('team-1');
    expect(team1Members).toHaveLength(1);
    expect(team1Members[0].userId).toBe('user-2');
  });
});
