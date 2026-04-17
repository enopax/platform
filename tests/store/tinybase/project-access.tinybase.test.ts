import { createStore } from 'tinybase';
import { TinyBaseProjectAccessRepository } from '@/lib/store/tinybase/project-access.tinybase';

describe('TinyBaseProjectAccessRepository', () => {
  let repo: TinyBaseProjectAccessRepository;

  beforeEach(() => {
    const store = createStore();
    repo = new TinyBaseProjectAccessRepository(store);
  });

  it('grants team access to project with role', async () => {
    const access = await repo.grant({
      projectId: 'proj-1',
      teamId: 'team-1',
      role: 'DEVELOPER',
      grantedBy: 'user-admin',
    });

    expect(access.id).toBeDefined();
    expect(access.projectId).toBe('proj-1');
    expect(access.teamId).toBe('team-1');
    expect(access.role).toBe('DEVELOPER');
    expect(access.grantedBy).toBe('user-admin');
    expect(access.grantedAt).toBeInstanceOf(Date);
  });

  it('finds access by project', async () => {
    await repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'DEVELOPER', grantedBy: 'admin' });
    await repo.grant({ projectId: 'proj-1', teamId: 'team-2', role: 'VIEWER', grantedBy: 'admin' });
    await repo.grant({ projectId: 'proj-2', teamId: 'team-3', role: 'ADMIN', grantedBy: 'admin' });

    const result = await repo.findByProjectId('proj-1');
    expect(result).toHaveLength(2);
  });

  it('finds access by team', async () => {
    await repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'DEVELOPER', grantedBy: 'admin' });
    await repo.grant({ projectId: 'proj-2', teamId: 'team-1', role: 'VIEWER', grantedBy: 'admin' });
    await repo.grant({ projectId: 'proj-3', teamId: 'team-2', role: 'ADMIN', grantedBy: 'admin' });

    const result = await repo.findByTeamId('team-1');
    expect(result).toHaveLength(2);
  });

  it('updates role', async () => {
    const access = await repo.grant({
      projectId: 'proj-1',
      teamId: 'team-1',
      role: 'VIEWER',
      grantedBy: 'admin',
    });

    const updated = await repo.updateRole(access.id, 'ADMIN');

    expect(updated.id).toBe(access.id);
    expect(updated.role).toBe('ADMIN');
    expect(updated.projectId).toBe('proj-1');
    expect(updated.teamId).toBe('team-1');
  });

  it('revokes access', async () => {
    const access = await repo.grant({
      projectId: 'proj-1',
      teamId: 'team-1',
      role: 'DEVELOPER',
      grantedBy: 'admin',
    });

    await repo.revoke(access.id);

    const result = await repo.findByProjectId('proj-1');
    expect(result).toHaveLength(0);
  });

  it('revokes all access for a team (cascade)', async () => {
    await repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'DEVELOPER', grantedBy: 'admin' });
    await repo.grant({ projectId: 'proj-2', teamId: 'team-1', role: 'VIEWER', grantedBy: 'admin' });
    await repo.grant({ projectId: 'proj-1', teamId: 'team-2', role: 'ADMIN', grantedBy: 'admin' });

    await repo.revokeAllForTeam('team-1');

    const remaining = await repo.findByTeamId('team-1');
    expect(remaining).toHaveLength(0);

    const proj1Access = await repo.findByProjectId('proj-1');
    expect(proj1Access).toHaveLength(1);
    expect(proj1Access[0].teamId).toBe('team-2');
  });

  it('prevents duplicate grant (same team+project)', async () => {
    await repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'DEVELOPER', grantedBy: 'admin' });

    await expect(
      repo.grant({ projectId: 'proj-1', teamId: 'team-1', role: 'VIEWER', grantedBy: 'admin' })
    ).rejects.toThrow('already has access');
  });
});
