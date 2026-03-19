import { createStore } from 'tinybase';
import { TinyBaseAuditLogRepository } from '@/lib/store/tinybase/audit-log.tinybase';
import type { CreateAuditLogData } from '@/lib/store/repositories/audit-log.repository';

describe('TinyBaseAuditLogRepository', () => {
  let repo: TinyBaseAuditLogRepository;

  beforeEach(() => {
    const store = createStore();
    repo = new TinyBaseAuditLogRepository(store);
  });

  const sampleData: CreateAuditLogData = {
    entityType: 'ORGANISATION',
    entityId: 'org-1',
    userId: 'user-1',
    actorId: 'actor-1',
    action: 'ADDED',
    newRole: 'MEMBER',
  };

  describe('create', () => {
    it('creates an audit log entry with generated id and timestamp', async () => {
      const log = await repo.create(sampleData);
      expect(log.id).toBeDefined();
      expect(log.entityType).toBe('ORGANISATION');
      expect(log.entityId).toBe('org-1');
      expect(log.userId).toBe('user-1');
      expect(log.actorId).toBe('actor-1');
      expect(log.action).toBe('ADDED');
      expect(log.newRole).toBe('MEMBER');
      expect(log.oldRole).toBeNull();
      expect(log.reason).toBeNull();
      expect(log.createdAt).toBeInstanceOf(Date);
    });

    it('stores optional fields', async () => {
      const log = await repo.create({
        ...sampleData,
        action: 'ROLE_CHANGED',
        oldRole: 'MEMBER',
        newRole: 'ADMIN',
        reason: 'Promotion approved',
      });
      expect(log.oldRole).toBe('MEMBER');
      expect(log.newRole).toBe('ADMIN');
      expect(log.reason).toBe('Promotion approved');
    });
  });

  describe('findByEntity', () => {
    it('returns logs for a specific entity', async () => {
      await repo.create(sampleData);
      await repo.create({ ...sampleData, userId: 'user-2', action: 'REMOVED' });
      await repo.create({ ...sampleData, entityId: 'org-2' });

      const logs = await repo.findByEntity('ORGANISATION', 'org-1');
      expect(logs).toHaveLength(2);
      expect(logs.every(l => l.entityId === 'org-1')).toBe(true);
    });

    it('returns empty array when no logs exist', async () => {
      const logs = await repo.findByEntity('ORGANISATION', 'nonexistent');
      expect(logs).toEqual([]);
    });

    it('orders by createdAt desc', async () => {
      await repo.create({ ...sampleData, action: 'ADDED' });
      await new Promise(r => setTimeout(r, 5));
      await repo.create({ ...sampleData, action: 'PROMOTED' });

      const logs = await repo.findByEntity('ORGANISATION', 'org-1');
      expect(logs[0].action).toBe('PROMOTED');
      expect(logs[1].action).toBe('ADDED');
    });

    it('respects limit', async () => {
      for (let i = 0; i < 5; i++) {
        await repo.create({ ...sampleData, userId: `user-${i}` });
      }
      const logs = await repo.findByEntity('ORGANISATION', 'org-1', { limit: 3 });
      expect(logs).toHaveLength(3);
    });
  });

  describe('findByUserId', () => {
    it('returns logs where user is the target', async () => {
      await repo.create(sampleData);
      await repo.create({ ...sampleData, userId: 'user-2' });
      await repo.create({ ...sampleData, entityId: 'org-2' });

      const logs = await repo.findByUserId('user-1');
      expect(logs).toHaveLength(2);
      expect(logs.every(l => l.userId === 'user-1')).toBe(true);
    });

    it('returns empty for unknown user', async () => {
      const logs = await repo.findByUserId('unknown');
      expect(logs).toEqual([]);
    });
  });
});
