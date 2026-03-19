import { createStore } from 'tinybase';
import { TinyBaseJoinRequestRepository } from '@/lib/store/tinybase/join-request.tinybase';

describe('TinyBaseJoinRequestRepository', () => {
  let repo: TinyBaseJoinRequestRepository;

  beforeEach(() => {
    repo = new TinyBaseJoinRequestRepository(createStore());
  });

  describe('create', () => {
    it('creates a pending join request', async () => {
      const req = await repo.create({ userId: 'u1', organisationId: 'org-1' });
      expect(req.id).toBeDefined();
      expect(req.userId).toBe('u1');
      expect(req.organisationId).toBe('org-1');
      expect(req.status).toBe('PENDING');
      expect(req.respondedBy).toBeNull();
      expect(req.respondedAt).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns request when found', async () => {
      const created = await repo.create({ userId: 'u1', organisationId: 'org-1' });
      const found = await repo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.userId).toBe('u1');
    });

    it('returns null for missing', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findByUserAndOrg', () => {
    it('finds by user and org', async () => {
      await repo.create({ userId: 'u1', organisationId: 'org-1' });
      const found = await repo.findByUserAndOrg('u1', 'org-1');
      expect(found).not.toBeNull();
    });

    it('filters by status', async () => {
      const req = await repo.create({ userId: 'u1', organisationId: 'org-1' });
      await repo.update(req.id, { status: 'APPROVED' });

      expect(await repo.findByUserAndOrg('u1', 'org-1', 'PENDING')).toBeNull();
      expect(await repo.findByUserAndOrg('u1', 'org-1', 'APPROVED')).not.toBeNull();
    });
  });

  describe('findLatestByUserAndOrg', () => {
    it('returns the most recent request', async () => {
      await repo.create({ userId: 'u1', organisationId: 'org-1' });
      await new Promise(r => setTimeout(r, 5));
      const second = await repo.create({ userId: 'u1', organisationId: 'org-1' });

      const latest = await repo.findLatestByUserAndOrg('u1', 'org-1');
      expect(latest).not.toBeNull();
      expect(latest!.id).toBe(second.id);
    });

    it('returns null when none exist', async () => {
      expect(await repo.findLatestByUserAndOrg('u1', 'org-99')).toBeNull();
    });
  });

  describe('findByOrgId', () => {
    it('returns requests for org', async () => {
      await repo.create({ userId: 'u1', organisationId: 'org-1' });
      await repo.create({ userId: 'u2', organisationId: 'org-1' });
      await repo.create({ userId: 'u3', organisationId: 'org-2' });

      const results = await repo.findByOrgId('org-1');
      expect(results).toHaveLength(2);
    });

    it('filters by status', async () => {
      const req = await repo.create({ userId: 'u1', organisationId: 'org-1' });
      await repo.create({ userId: 'u2', organisationId: 'org-1' });
      await repo.update(req.id, { status: 'APPROVED' });

      const pending = await repo.findByOrgId('org-1', 'PENDING');
      expect(pending).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates status and respondedBy', async () => {
      const req = await repo.create({ userId: 'u1', organisationId: 'org-1' });
      const now = new Date();
      const updated = await repo.update(req.id, {
        status: 'APPROVED',
        respondedBy: 'admin-1',
        respondedAt: now,
      });
      expect(updated.status).toBe('APPROVED');
      expect(updated.respondedBy).toBe('admin-1');
    });

    it('throws for missing request', async () => {
      await expect(repo.update('missing', { status: 'REJECTED' })).rejects.toThrow();
    });
  });
});
