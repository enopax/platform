import { createStore } from 'tinybase';
import { TinyBaseProjectRepository } from '@/lib/store/tinybase/project.tinybase';

describe('TinyBaseProjectRepository', () => {
  let repo: TinyBaseProjectRepository;

  beforeEach(() => {
    repo = new TinyBaseProjectRepository(createStore());
  });

  describe('create', () => {
    it('creates a project with defaults', async () => {
      const p = await repo.create({ name: 'my-project', organisationId: 'org-1' });
      expect(p.id).toBeDefined();
      expect(p.name).toBe('my-project');
      expect(p.organisationId).toBe('org-1');
      expect(p.status).toBe('PLANNING');
      expect(p.priority).toBe('MEDIUM');
      expect(p.isActive).toBe(true);
      expect(p.progress).toBe(0);
    });
  });

  describe('findById', () => {
    it('returns project when found', async () => {
      const created = await repo.create({ name: 'test', organisationId: 'org-1' });
      const found = await repo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.name).toBe('test');
    });

    it('returns null for missing', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findByNameAndOrg', () => {
    it('finds active project by name and org', async () => {
      await repo.create({ name: 'alpha', organisationId: 'org-1' });
      await repo.create({ name: 'alpha', organisationId: 'org-2' });

      const found = await repo.findByNameAndOrg('alpha', 'org-1');
      expect(found).not.toBeNull();
      expect(found!.organisationId).toBe('org-1');
    });

    it('returns null for inactive project', async () => {
      const p = await repo.create({ name: 'alpha', organisationId: 'org-1' });
      await repo.update(p.id, { isActive: false });
      expect(await repo.findByNameAndOrg('alpha', 'org-1')).toBeNull();
    });
  });

  describe('findByOrgId', () => {
    it('returns projects for org', async () => {
      await repo.create({ name: 'p1', organisationId: 'org-1' });
      await repo.create({ name: 'p2', organisationId: 'org-1' });
      await repo.create({ name: 'p3', organisationId: 'org-2' });

      const results = await repo.findByOrgId('org-1');
      expect(results).toHaveLength(2);
    });

    it('filters by isActive', async () => {
      const p = await repo.create({ name: 'p1', organisationId: 'org-1' });
      await repo.create({ name: 'p2', organisationId: 'org-1' });
      await repo.update(p.id, { isActive: false });

      expect(await repo.findByOrgId('org-1', { isActive: true })).toHaveLength(1);
      expect(await repo.findByOrgId('org-1', { isActive: false })).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates name and status', async () => {
      const p = await repo.create({ name: 'old', organisationId: 'org-1' });
      const updated = await repo.update(p.id, { name: 'new', status: 'ACTIVE' });
      expect(updated.name).toBe('new');
      expect(updated.status).toBe('ACTIVE');
    });

    it('soft deletes via isActive', async () => {
      const p = await repo.create({ name: 'test', organisationId: 'org-1' });
      const deleted = await repo.update(p.id, { isActive: false });
      expect(deleted.isActive).toBe(false);
    });

    it('throws for missing project', async () => {
      await expect(repo.update('missing', { name: 'x' })).rejects.toThrow();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await repo.create({ name: 'web-app', organisationId: 'org-1', description: 'Frontend' });
      await repo.create({ name: 'api-server', organisationId: 'org-1', description: 'Backend API' });
      await repo.create({ name: 'docs-site', organisationId: 'org-2', description: 'Documentation' });
    });

    it('searches by name (case-insensitive)', async () => {
      const results = await repo.search('web');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('web-app');
    });

    it('searches by description', async () => {
      const results = await repo.search('backend');
      expect(results).toHaveLength(1);
    });

    it('respects limit', async () => {
      const results = await repo.search('', 2);
      expect(results).toHaveLength(2);
    });
  });
});
