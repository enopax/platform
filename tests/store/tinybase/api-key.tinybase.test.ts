import { createStore } from 'tinybase';
import { createFilePersister } from 'tinybase/persisters/persister-file';
import { TinyBaseApiKeyRepository } from '@/lib/store/tinybase/api-key.tinybase';
import type { CreateApiKeyData } from '@/lib/store/repositories/api-key.repository';
import fs from 'fs';
import path from 'path';
import os from 'os';

const sampleData: CreateApiKeyData = {
  name: 'Test Key',
  keyPreview: 'sk_test_1234',
  hashedKey: 'hashed-abc123',
  permissions: ['read'],
  userId: 'user-1',
};

describe('TinyBaseApiKeyRepository', () => {
  let repo: TinyBaseApiKeyRepository;
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    repo = new TinyBaseApiKeyRepository(store);
  });

  describe('create', () => {
    it('creates a key with generated id and timestamps', async () => {
      const key = await repo.create(sampleData);
      expect(key.id).toBeDefined();
      expect(key.id.length).toBeGreaterThan(0);
      expect(key.name).toBe('Test Key');
      expect(key.permissions).toEqual(['read']);
      expect(key.userId).toBe('user-1');
      expect(key.isActive).toBe(true);
      expect(key.usageCount).toBe(0);
      expect(key.createdAt).toBeInstanceOf(Date);
      expect(key.updatedAt).toBeInstanceOf(Date);
    });

    it('stores permissions as array', async () => {
      const key = await repo.create({
        ...sampleData,
        permissions: ['read', 'write', 'admin'],
      });
      expect(key.permissions).toEqual(['read', 'write', 'admin']);
    });

    it('handles expiresAt', async () => {
      const expires = new Date('2027-06-01');
      const key = await repo.create({ ...sampleData, expiresAt: expires });
      expect(key.expiresAt).toEqual(expires);
    });
  });

  describe('findById', () => {
    it('finds existing key', async () => {
      const created = await repo.create(sampleData);
      const found = await repo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Test Key');
    });

    it('returns null for missing key', async () => {
      expect(await repo.findById('nonexistent')).toBeNull();
    });
  });

  describe('findByHashedKey', () => {
    it('finds by hash', async () => {
      await repo.create(sampleData);
      const found = await repo.findByHashedKey('hashed-abc123');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Test Key');
    });
  });

  describe('findByUserId', () => {
    it('returns keys for user', async () => {
      await repo.create(sampleData);
      await repo.create({ ...sampleData, name: 'Key 2', hashedKey: 'h2' });
      await repo.create({ ...sampleData, name: 'Other', hashedKey: 'h3', userId: 'user-2' });

      const keys = await repo.findByUserId('user-1');
      expect(keys).toHaveLength(2);
    });

    it('orders by createdAt desc', async () => {
      await repo.create({ ...sampleData, name: 'First', hashedKey: 'h1' });
      // Small delay to ensure different timestamps
      await new Promise(r => setTimeout(r, 5));
      await repo.create({ ...sampleData, name: 'Second', hashedKey: 'h2' });

      const keys = await repo.findByUserId('user-1', { orderBy: 'createdAt' });
      expect(keys[0].name).toBe('Second');
    });

    it('supports skip and take', async () => {
      for (let i = 0; i < 5; i++) {
        await repo.create({ ...sampleData, name: `Key ${i}`, hashedKey: `h${i}` });
      }
      const page = await repo.findByUserId('user-1', { skip: 1, take: 2 });
      expect(page).toHaveLength(2);
    });
  });

  describe('countByUserId', () => {
    it('counts all keys', async () => {
      await repo.create(sampleData);
      await repo.create({ ...sampleData, name: 'K2', hashedKey: 'h2' });
      expect(await repo.countByUserId('user-1')).toBe(2);
    });

    it('filters by isActive', async () => {
      const key = await repo.create(sampleData);
      await repo.create({ ...sampleData, name: 'K2', hashedKey: 'h2' });
      await repo.update(key.id, { isActive: false });

      expect(await repo.countByUserId('user-1', { isActive: true })).toBe(1);
      expect(await repo.countByUserId('user-1', { isActive: false })).toBe(1);
    });
  });

  describe('update', () => {
    it('updates name and usageCount', async () => {
      const key = await repo.create(sampleData);
      const updated = await repo.update(key.id, { name: 'Renamed', usageCount: 10 });
      expect(updated.name).toBe('Renamed');
      expect(updated.usageCount).toBe(10);
    });

    it('deactivates key', async () => {
      const key = await repo.create(sampleData);
      const updated = await repo.update(key.id, { isActive: false });
      expect(updated.isActive).toBe(false);
    });

    it('throws for missing key', async () => {
      await expect(repo.update('missing', { name: 'x' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('removes the key', async () => {
      const key = await repo.create(sampleData);
      await repo.delete(key.id);
      expect(await repo.findById(key.id)).toBeNull();
    });
  });
});

describe('TinyBaseApiKeyRepository file persistence', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tinybase-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('persists data to file and loads it back', async () => {
    const filePath = path.join(tmpDir, 'api-keys.json');

    // Write data
    const store1 = createStore();
    const persister1 = createFilePersister(store1, filePath);
    const repo1 = new TinyBaseApiKeyRepository(store1);

    const created = await repo1.create(sampleData);
    await persister1.save();
    await persister1.destroy();

    // Load data in a new store
    const store2 = createStore();
    const persister2 = createFilePersister(store2, filePath);
    await persister2.load();
    const repo2 = new TinyBaseApiKeyRepository(store2);

    const loaded = await repo2.findById(created.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe('Test Key');
    expect(loaded!.permissions).toEqual(['read']);
    expect(loaded!.userId).toBe('user-1');
    expect(loaded!.isActive).toBe(true);

    await persister2.destroy();
  });

  it('persists multiple keys and survives restart', async () => {
    const filePath = path.join(tmpDir, 'api-keys.json');

    // Create multiple keys
    const store1 = createStore();
    const persister1 = createFilePersister(store1, filePath);
    const repo1 = new TinyBaseApiKeyRepository(store1);

    await repo1.create({ ...sampleData, name: 'Key 1', hashedKey: 'h1' });
    await repo1.create({ ...sampleData, name: 'Key 2', hashedKey: 'h2' });
    await repo1.create({ ...sampleData, name: 'Key 3', hashedKey: 'h3', userId: 'user-2' });
    await persister1.save();
    await persister1.destroy();

    // Reload
    const store2 = createStore();
    const persister2 = createFilePersister(store2, filePath);
    await persister2.load();
    const repo2 = new TinyBaseApiKeyRepository(store2);

    expect(await repo2.countByUserId('user-1')).toBe(2);
    expect(await repo2.countByUserId('user-2')).toBe(1);

    const keys = await repo2.findByUserId('user-1');
    expect(keys.map(k => k.name).sort()).toEqual(['Key 1', 'Key 2']);

    await persister2.destroy();
  });
});
