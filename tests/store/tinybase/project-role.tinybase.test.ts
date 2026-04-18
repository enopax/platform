import { createStore } from 'tinybase';
import { TinyBaseProjectRoleRepository } from '@/lib/store/tinybase/project-role.tinybase';

describe('TinyBaseProjectRoleRepository', () => {
  let repo: TinyBaseProjectRoleRepository;

  beforeEach(() => {
    const store = createStore();
    repo = new TinyBaseProjectRoleRepository(store);
  });

  it('creates a role definition with permissions', async () => {
    const role = await repo.create({
      organisationId: 'org-1',
      name: 'Developer',
      description: 'Can create and edit resources',
      permissions: ['project:view', 'resource:view', 'resource:create'],
      rank: 1,
    });

    expect(role.id).toBeDefined();
    expect(role.organisationId).toBe('org-1');
    expect(role.name).toBe('Developer');
    expect(role.description).toBe('Can create and edit resources');
    expect(role.permissions).toEqual(['project:view', 'resource:view', 'resource:create']);
    expect(role.isBuiltIn).toBe(false);
    expect(role.rank).toBe(1);
    expect(role.createdAt).toBeInstanceOf(Date);
    expect(role.updatedAt).toBeInstanceOf(Date);
  });

  it('finds roles by organisation', async () => {
    await repo.create({ organisationId: 'org-1', name: 'Viewer', description: '', permissions: ['project:view'], rank: 0 });
    await repo.create({ organisationId: 'org-1', name: 'Admin', description: '', permissions: ['project:view', 'access:manage'], rank: 3 });
    await repo.create({ organisationId: 'org-2', name: 'Viewer', description: '', permissions: ['project:view'], rank: 0 });

    const org1Roles = await repo.findByOrgId('org-1');
    expect(org1Roles).toHaveLength(2);

    const org2Roles = await repo.findByOrgId('org-2');
    expect(org2Roles).toHaveLength(1);
  });

  it('finds by name and org', async () => {
    await repo.create({ organisationId: 'org-1', name: 'Viewer', description: '', permissions: ['project:view'], rank: 0 });
    await repo.create({ organisationId: 'org-2', name: 'Viewer', description: '', permissions: ['project:view'], rank: 0 });

    const found = await repo.findByNameAndOrg('Viewer', 'org-1');
    expect(found).not.toBeNull();
    expect(found!.organisationId).toBe('org-1');

    const notFound = await repo.findByNameAndOrg('Admin', 'org-1');
    expect(notFound).toBeNull();
  });

  it('updates role permissions', async () => {
    const role = await repo.create({
      organisationId: 'org-1',
      name: 'Developer',
      description: 'Old description',
      permissions: ['project:view', 'resource:view'],
      rank: 1,
    });

    const updated = await repo.update(role.id, {
      permissions: ['project:view', 'resource:view', 'resource:create', 'resource:edit'],
      description: 'New description',
    });

    expect(updated.permissions).toEqual(['project:view', 'resource:view', 'resource:create', 'resource:edit']);
    expect(updated.description).toBe('New description');
    expect(updated.id).toBe(role.id);
  });

  it('prevents deletion of built-in roles', async () => {
    const role = await repo.create({
      organisationId: 'org-1',
      name: 'Admin',
      description: 'Built-in admin',
      permissions: ['project:view', 'access:manage'],
      isBuiltIn: true,
      rank: 3,
    });

    await expect(repo.delete(role.id)).rejects.toThrow('Cannot delete built-in role');
  });

  it('deletes custom roles', async () => {
    const role = await repo.create({
      organisationId: 'org-1',
      name: 'Custom Role',
      description: 'A custom role',
      permissions: ['project:view'],
      isBuiltIn: false,
      rank: 5,
    });

    await repo.delete(role.id);

    const found = await repo.findById(role.id);
    expect(found).toBeNull();
  });

  it('permissions are stored and retrieved as arrays (not corrupted by JSON serialisation)', async () => {
    const permissions = ['project:view', 'resource:view', 'resource:create', 'resource:edit', 'resource:delete', 'resource:deploy', 'access:view', 'access:manage'] as const;

    const role = await repo.create({
      organisationId: 'org-1',
      name: 'Power User',
      description: '',
      permissions: [...permissions],
      rank: 2,
    });

    const retrieved = await repo.findById(role.id);
    expect(retrieved).not.toBeNull();
    expect(Array.isArray(retrieved!.permissions)).toBe(true);
    expect(retrieved!.permissions).toHaveLength(permissions.length);
    expect(retrieved!.permissions).toEqual([...permissions]);
  });
});
