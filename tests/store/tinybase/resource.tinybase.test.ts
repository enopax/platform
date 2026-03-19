import { createStore } from 'tinybase';
import { TinyBaseResourceRepository, TinyBaseProjectResourceRepository } from '@/lib/store/tinybase/resource.tinybase';

describe('TinyBaseResourceRepository', () => {
  let repo: TinyBaseResourceRepository;

  beforeEach(() => {
    repo = new TinyBaseResourceRepository(createStore());
  });

  describe('create', () => {
    it('creates a resource with defaults', async () => {
      const r = await repo.create({ name: 'my-db', ownerId: 'u1', organisationId: 'org-1', type: 'DATABASE' });
      expect(r.id).toBeDefined();
      expect(r.name).toBe('my-db');
      expect(r.type).toBe('DATABASE');
      expect(r.status).toBe('ACTIVE');
      expect(r.isActive).toBe(true);
    });

    it('stores configuration as JSON', async () => {
      const r = await repo.create({
        name: 'test', ownerId: 'u1', organisationId: 'org-1',
        configuration: { cpu: 2, ram: '4GB' },
      });
      expect(r.configuration).toEqual({ cpu: 2, ram: '4GB' });
    });
  });

  describe('findById', () => {
    it('returns resource when found', async () => {
      const created = await repo.create({ name: 'test', ownerId: 'u1', organisationId: 'org-1' });
      expect(await repo.findById(created.id)).not.toBeNull();
    });

    it('returns null for missing', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findByOrgId', () => {
    it('returns active resources for org', async () => {
      await repo.create({ name: 'r1', ownerId: 'u1', organisationId: 'org-1' });
      await repo.create({ name: 'r2', ownerId: 'u1', organisationId: 'org-1' });
      await repo.create({ name: 'r3', ownerId: 'u1', organisationId: 'org-2' });

      expect(await repo.findByOrgId('org-1')).toHaveLength(2);
    });
  });

  describe('findByNameAndOrg', () => {
    it('finds by name and org', async () => {
      await repo.create({ name: 'my-db', ownerId: 'u1', organisationId: 'org-1' });
      expect(await repo.findByNameAndOrg('my-db', 'org-1')).not.toBeNull();
    });

    it('excludes specified id', async () => {
      const r = await repo.create({ name: 'my-db', ownerId: 'u1', organisationId: 'org-1' });
      expect(await repo.findByNameAndOrg('my-db', 'org-1', r.id)).toBeNull();
    });
  });

  describe('update', () => {
    it('updates status and configuration', async () => {
      const r = await repo.create({ name: 'test', ownerId: 'u1', organisationId: 'org-1' });
      const updated = await repo.update(r.id, {
        status: 'PROVISIONING',
        configuration: { stage: 'init' },
      });
      expect(updated.status).toBe('PROVISIONING');
      expect(updated.configuration).toEqual({ stage: 'init' });
    });
  });

  describe('search', () => {
    it('finds by name', async () => {
      await repo.create({ name: 'postgres-main', ownerId: 'u1', organisationId: 'org-1' });
      await repo.create({ name: 'redis-cache', ownerId: 'u1', organisationId: 'org-1' });

      const results = await repo.search('postgres');
      expect(results).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('removes the resource', async () => {
      const r = await repo.create({ name: 'test', ownerId: 'u1', organisationId: 'org-1' });
      await repo.delete(r.id);
      expect(await repo.findById(r.id)).toBeNull();
    });
  });
});

describe('TinyBaseProjectResourceRepository', () => {
  let repo: TinyBaseProjectResourceRepository;

  beforeEach(() => {
    repo = new TinyBaseProjectResourceRepository(createStore());
  });

  describe('create', () => {
    it('creates an allocation', async () => {
      const pr = await repo.create({ projectId: 'p1', resourceId: 'r1', allocatedBy: 'u1' });
      expect(pr.projectId).toBe('p1');
      expect(pr.resourceId).toBe('r1');
      expect(pr.allocatedBy).toBe('u1');
    });
  });

  describe('findByProjectAndResource', () => {
    it('finds allocation', async () => {
      await repo.create({ projectId: 'p1', resourceId: 'r1', allocatedBy: 'u1' });
      expect(await repo.findByProjectAndResource('p1', 'r1')).not.toBeNull();
    });

    it('returns null when not found', async () => {
      expect(await repo.findByProjectAndResource('p1', 'r99')).toBeNull();
    });
  });

  describe('findByProjectId', () => {
    it('returns allocations for project', async () => {
      await repo.create({ projectId: 'p1', resourceId: 'r1', allocatedBy: 'u1' });
      await repo.create({ projectId: 'p1', resourceId: 'r2', allocatedBy: 'u1' });
      await repo.create({ projectId: 'p2', resourceId: 'r3', allocatedBy: 'u1' });

      expect(await repo.findByProjectId('p1')).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('removes allocation', async () => {
      await repo.create({ projectId: 'p1', resourceId: 'r1', allocatedBy: 'u1' });
      await repo.delete('p1', 'r1');
      expect(await repo.findByProjectAndResource('p1', 'r1')).toBeNull();
    });
  });

  describe('update', () => {
    it('updates quota limit', async () => {
      await repo.create({ projectId: 'p1', resourceId: 'r1', allocatedBy: 'u1' });
      const updated = await repo.update('p1', 'r1', { quotaLimit: BigInt(1000) });
      expect(updated.quotaLimit).toBe(BigInt(1000));
    });
  });
});
