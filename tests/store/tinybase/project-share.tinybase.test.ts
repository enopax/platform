import { createStore } from 'tinybase';
import { TinyBaseProjectShareRepository } from '@/lib/store/tinybase/project-share.tinybase';

describe('TinyBaseProjectShareRepository', () => {
  let repo: TinyBaseProjectShareRepository;

  beforeEach(() => {
    const store = createStore();
    repo = new TinyBaseProjectShareRepository(store);
  });

  it('creates a share and retrieves it by id', async () => {
    const share = await repo.create({
      projectId: 'proj-1',
      sharedWithType: 'ORGANISATION',
      sharedWithId: 'org-2',
      permission: 'VIEW',
      sharedBy: 'user-admin',
    });

    expect(share.id).toBeDefined();
    expect(share.projectId).toBe('proj-1');
    expect(share.sharedWithType).toBe('ORGANISATION');
    expect(share.sharedWithId).toBe('org-2');
    expect(share.permission).toBe('VIEW');
    expect(share.sharedBy).toBe('user-admin');
    expect(share.sharedAt).toBeInstanceOf(Date);

    const found = await repo.findById(share.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(share.id);
  });

  it('finds shares by project', async () => {
    await repo.create({ projectId: 'proj-1', sharedWithType: 'ORGANISATION', sharedWithId: 'org-2', permission: 'VIEW', sharedBy: 'admin' });
    await repo.create({ projectId: 'proj-1', sharedWithType: 'USER', sharedWithId: 'user-5', permission: 'CONTRIBUTE', sharedBy: 'admin' });
    await repo.create({ projectId: 'proj-2', sharedWithType: 'ORGANISATION', sharedWithId: 'org-3', permission: 'MANAGE', sharedBy: 'admin' });

    const result = await repo.findByProjectId('proj-1');
    expect(result).toHaveLength(2);
  });

  it('finds shares by entity (what is shared with org X)', async () => {
    await repo.create({ projectId: 'proj-1', sharedWithType: 'ORGANISATION', sharedWithId: 'org-2', permission: 'VIEW', sharedBy: 'admin' });
    await repo.create({ projectId: 'proj-2', sharedWithType: 'ORGANISATION', sharedWithId: 'org-2', permission: 'CONTRIBUTE', sharedBy: 'admin' });
    await repo.create({ projectId: 'proj-3', sharedWithType: 'USER', sharedWithId: 'org-2', permission: 'VIEW', sharedBy: 'admin' });

    const result = await repo.findSharedWithEntity('ORGANISATION', 'org-2');
    expect(result).toHaveLength(2);
    expect(result.every(s => s.sharedWithType === 'ORGANISATION')).toBe(true);
  });

  it('prevents duplicate share (same project + same entity)', async () => {
    await repo.create({ projectId: 'proj-1', sharedWithType: 'ORGANISATION', sharedWithId: 'org-2', permission: 'VIEW', sharedBy: 'admin' });

    await expect(
      repo.create({ projectId: 'proj-1', sharedWithType: 'ORGANISATION', sharedWithId: 'org-2', permission: 'MANAGE', sharedBy: 'admin' })
    ).rejects.toThrow('already shared');
  });

  it('updates permission level', async () => {
    const share = await repo.create({
      projectId: 'proj-1',
      sharedWithType: 'ORGANISATION',
      sharedWithId: 'org-2',
      permission: 'VIEW',
      sharedBy: 'admin',
    });

    const updated = await repo.updatePermission(share.id, 'MANAGE');

    expect(updated.id).toBe(share.id);
    expect(updated.permission).toBe('MANAGE');
    expect(updated.projectId).toBe('proj-1');
    expect(updated.sharedWithId).toBe('org-2');
  });

  it('revokes a share', async () => {
    const share = await repo.create({
      projectId: 'proj-1',
      sharedWithType: 'ORGANISATION',
      sharedWithId: 'org-2',
      permission: 'VIEW',
      sharedBy: 'admin',
    });

    await repo.revoke(share.id);

    const found = await repo.findById(share.id);
    expect(found).toBeNull();

    const shares = await repo.findByProjectId('proj-1');
    expect(shares).toHaveLength(0);
  });
});
