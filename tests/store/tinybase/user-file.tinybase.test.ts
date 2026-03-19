import { createStore } from 'tinybase';
import { TinyBaseUserFileRepository } from '@/lib/store/tinybase/user-file.tinybase';

describe('TinyBaseUserFileRepository', () => {
  let repo: TinyBaseUserFileRepository;

  beforeEach(() => {
    repo = new TinyBaseUserFileRepository(createStore());
  });

  describe('create', () => {
    it('creates a file with defaults', async () => {
      const f = await repo.create({
        userId: 'u1',
        ipfsHash: 'QmTest123',
        fileName: 'test.txt',
        fileSize: BigInt(1024),
        fileType: 'text/plain',
      });
      expect(f.id).toBeDefined();
      expect(f.userId).toBe('u1');
      expect(f.ipfsHash).toBe('QmTest123');
      expect(f.fileSize).toBe(BigInt(1024));
      expect(f.isPinned).toBe(true);
      expect(f.replicationCount).toBe(0);
    });
  });

  describe('findById', () => {
    it('returns file when found', async () => {
      const created = await repo.create({
        userId: 'u1', ipfsHash: 'Qm1', fileName: 'a.txt',
        fileSize: BigInt(100), fileType: 'text/plain',
      });
      expect(await repo.findById(created.id)).not.toBeNull();
    });

    it('returns null for missing', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns files for user', async () => {
      await repo.create({ userId: 'u1', ipfsHash: 'Qm1', fileName: 'a.txt', fileSize: BigInt(100), fileType: 'text/plain' });
      await repo.create({ userId: 'u1', ipfsHash: 'Qm2', fileName: 'b.txt', fileSize: BigInt(200), fileType: 'text/plain' });
      await repo.create({ userId: 'u2', ipfsHash: 'Qm3', fileName: 'c.txt', fileSize: BigInt(300), fileType: 'text/plain' });

      expect(await repo.findByUserId('u1')).toHaveLength(2);
    });

    it('supports pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await repo.create({ userId: 'u1', ipfsHash: `Qm${i}`, fileName: `f${i}.txt`, fileSize: BigInt(100), fileType: 'text/plain' });
      }
      expect(await repo.findByUserId('u1', { skip: 1, take: 2 })).toHaveLength(2);
    });
  });

  describe('findByProjectId', () => {
    it('returns files for project', async () => {
      await repo.create({ userId: 'u1', projectId: 'p1', ipfsHash: 'Qm1', fileName: 'a.txt', fileSize: BigInt(100), fileType: 'text/plain' });
      await repo.create({ userId: 'u1', projectId: 'p1', ipfsHash: 'Qm2', fileName: 'b.txt', fileSize: BigInt(200), fileType: 'text/plain' });
      await repo.create({ userId: 'u1', projectId: 'p2', ipfsHash: 'Qm3', fileName: 'c.txt', fileSize: BigInt(300), fileType: 'text/plain' });

      expect(await repo.findByProjectId('p1')).toHaveLength(2);
    });
  });

  describe('findByUserAndHash', () => {
    it('finds by user + hash', async () => {
      await repo.create({ userId: 'u1', ipfsHash: 'QmUnique', fileName: 'test.txt', fileSize: BigInt(100), fileType: 'text/plain' });
      expect(await repo.findByUserAndHash('u1', 'QmUnique')).not.toBeNull();
    });

    it('returns null for different user', async () => {
      await repo.create({ userId: 'u1', ipfsHash: 'QmUnique', fileName: 'test.txt', fileSize: BigInt(100), fileType: 'text/plain' });
      expect(await repo.findByUserAndHash('u2', 'QmUnique')).toBeNull();
    });
  });

  describe('update', () => {
    it('updates pin status', async () => {
      const f = await repo.create({ userId: 'u1', ipfsHash: 'Qm1', fileName: 'a.txt', fileSize: BigInt(100), fileType: 'text/plain' });
      const updated = await repo.update(f.id, { isPinned: false, replicationCount: 0 });
      expect(updated.isPinned).toBe(false);
    });
  });

  describe('delete', () => {
    it('removes the file', async () => {
      const f = await repo.create({ userId: 'u1', ipfsHash: 'Qm1', fileName: 'a.txt', fileSize: BigInt(100), fileType: 'text/plain' });
      await repo.delete(f.id);
      expect(await repo.findById(f.id)).toBeNull();
    });
  });

  describe('countByUserId', () => {
    it('counts files for user', async () => {
      await repo.create({ userId: 'u1', ipfsHash: 'Qm1', fileName: 'a.txt', fileSize: BigInt(100), fileType: 'text/plain' });
      await repo.create({ userId: 'u1', ipfsHash: 'Qm2', fileName: 'b.txt', fileSize: BigInt(200), fileType: 'text/plain' });
      expect(await repo.countByUserId('u1')).toBe(2);
      expect(await repo.countByUserId('u2')).toBe(0);
    });
  });
});
