import type { ApiKey } from '@/lib/store/types';
import type { IApiKeyRepository, CreateApiKeyData } from '@/lib/store/repositories/api-key.repository';

class InMemoryApiKeyRepository implements IApiKeyRepository {
  private keys: Map<string, ApiKey> = new Map();
  private nextId = 1;

  async create(data: CreateApiKeyData): Promise<ApiKey> {
    const now = new Date();
    const key: ApiKey = {
      id: `key-${this.nextId++}`,
      name: data.name,
      keyPreview: data.keyPreview,
      hashedKey: data.hashedKey,
      permissions: data.permissions,
      userId: data.userId,
      lastUsedAt: null,
      usageCount: 0,
      isActive: true,
      expiresAt: data.expiresAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.keys.set(key.id, key);
    return key;
  }

  async findById(id: string): Promise<ApiKey | null> {
    return this.keys.get(id) ?? null;
  }

  async findByHashedKey(hashedKey: string): Promise<ApiKey | null> {
    for (const key of this.keys.values()) {
      if (key.hashedKey === hashedKey) return key;
    }
    return null;
  }

  async findByUserId(
    userId: string,
    options?: { skip?: number; take?: number; orderBy?: 'createdAt' }
  ): Promise<ApiKey[]> {
    let results = Array.from(this.keys.values()).filter(k => k.userId === userId);
    if (options?.orderBy === 'createdAt') {
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    if (options?.skip) results = results.slice(options.skip);
    if (options?.take) results = results.slice(0, options.take);
    return results;
  }

  async countByUserId(userId: string, filter?: { isActive?: boolean }): Promise<number> {
    return Array.from(this.keys.values()).filter(k => {
      if (k.userId !== userId) return false;
      if (filter?.isActive !== undefined && k.isActive !== filter.isActive) return false;
      return true;
    }).length;
  }

  async update(
    id: string,
    data: Partial<Pick<ApiKey, 'name' | 'isActive' | 'lastUsedAt' | 'usageCount'>>
  ): Promise<ApiKey> {
    const key = this.keys.get(id);
    if (!key) throw new Error(`ApiKey ${id} not found`);
    const updated = { ...key, ...data, updatedAt: new Date() };
    this.keys.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.keys.delete(id);
  }
}

describe('IApiKeyRepository contract', () => {
  let repo: IApiKeyRepository;

  beforeEach(() => {
    repo = new InMemoryApiKeyRepository();
  });

  const sampleData: CreateApiKeyData = {
    name: 'Test Key',
    keyPreview: 'sk_test_1234',
    hashedKey: 'hashed-abc123',
    permissions: ['read'],
    userId: 'user-1',
  };

  describe('create', () => {
    it('creates a key and returns it with generated id', async () => {
      const key = await repo.create(sampleData);
      expect(key.id).toBeDefined();
      expect(key.name).toBe('Test Key');
      expect(key.permissions).toEqual(['read']);
      expect(key.userId).toBe('user-1');
      expect(key.isActive).toBe(true);
      expect(key.usageCount).toBe(0);
    });

    it('sets expiresAt when provided', async () => {
      const expires = new Date('2027-01-01');
      const key = await repo.create({ ...sampleData, expiresAt: expires });
      expect(key.expiresAt).toEqual(expires);
    });

    it('sets expiresAt to null when not provided', async () => {
      const key = await repo.create(sampleData);
      expect(key.expiresAt).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the key when found', async () => {
      const created = await repo.create(sampleData);
      const found = await repo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it('returns null when not found', async () => {
      const found = await repo.findById('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('findByHashedKey', () => {
    it('returns the key matching the hash', async () => {
      await repo.create(sampleData);
      const found = await repo.findByHashedKey('hashed-abc123');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Test Key');
    });

    it('returns null for unknown hash', async () => {
      const found = await repo.findByHashedKey('unknown');
      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns all keys for a user', async () => {
      await repo.create(sampleData);
      await repo.create({ ...sampleData, name: 'Key 2', hashedKey: 'hash-2' });
      await repo.create({ ...sampleData, name: 'Key 3', hashedKey: 'hash-3', userId: 'user-2' });

      const keys = await repo.findByUserId('user-1');
      expect(keys).toHaveLength(2);
    });

    it('returns empty array for user with no keys', async () => {
      const keys = await repo.findByUserId('user-99');
      expect(keys).toEqual([]);
    });

    it('supports pagination with skip and take', async () => {
      for (let i = 0; i < 5; i++) {
        await repo.create({ ...sampleData, name: `Key ${i}`, hashedKey: `hash-${i}` });
      }
      const page = await repo.findByUserId('user-1', { skip: 2, take: 2 });
      expect(page).toHaveLength(2);
    });
  });

  describe('countByUserId', () => {
    it('counts all keys for a user', async () => {
      await repo.create(sampleData);
      await repo.create({ ...sampleData, name: 'Key 2', hashedKey: 'hash-2' });
      expect(await repo.countByUserId('user-1')).toBe(2);
    });

    it('filters by isActive', async () => {
      const key = await repo.create(sampleData);
      await repo.create({ ...sampleData, name: 'Key 2', hashedKey: 'hash-2' });
      await repo.update(key.id, { isActive: false });

      expect(await repo.countByUserId('user-1', { isActive: true })).toBe(1);
      expect(await repo.countByUserId('user-1', { isActive: false })).toBe(1);
    });

    it('returns 0 for user with no keys', async () => {
      expect(await repo.countByUserId('user-99')).toBe(0);
    });
  });

  describe('update', () => {
    it('updates specified fields', async () => {
      const key = await repo.create(sampleData);
      const updated = await repo.update(key.id, { name: 'Renamed Key', usageCount: 42 });
      expect(updated.name).toBe('Renamed Key');
      expect(updated.usageCount).toBe(42);
      expect(updated.permissions).toEqual(['read']);
    });

    it('updates isActive flag', async () => {
      const key = await repo.create(sampleData);
      const deactivated = await repo.update(key.id, { isActive: false });
      expect(deactivated.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('removes the key', async () => {
      const key = await repo.create(sampleData);
      await repo.delete(key.id);
      const found = await repo.findById(key.id);
      expect(found).toBeNull();
    });

    it('does not affect other keys', async () => {
      const key1 = await repo.create(sampleData);
      const key2 = await repo.create({ ...sampleData, name: 'Key 2', hashedKey: 'hash-2' });
      await repo.delete(key1.id);
      expect(await repo.findById(key2.id)).not.toBeNull();
    });
  });
});
