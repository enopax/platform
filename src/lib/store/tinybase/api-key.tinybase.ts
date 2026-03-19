import type { Store } from 'tinybase';
import type { ApiKey } from '../types';
import type { IApiKeyRepository, CreateApiKeyData } from '../repositories/api-key.repository';
import crypto from 'crypto';

const TABLE = 'api-keys';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToApiKey(id: string, row: Record<string, any>): ApiKey {
  return {
    id,
    name: row.name as string,
    keyPreview: row.keyPreview as string,
    hashedKey: row.hashedKey as string,
    permissions: JSON.parse(row.permissions as string),
    userId: row.userId as string,
    lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt as string) : null,
    usageCount: row.usageCount as number,
    isActive: row.isActive === 1,
    expiresAt: row.expiresAt ? new Date(row.expiresAt as string) : null,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

export class TinyBaseApiKeyRepository implements IApiKeyRepository {
  constructor(private store: Store) {}

  async create(data: CreateApiKeyData): Promise<ApiKey> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      name: data.name,
      keyPreview: data.keyPreview,
      hashedKey: data.hashedKey,
      permissions: JSON.stringify(data.permissions),
      userId: data.userId,
      lastUsedAt: '',
      usageCount: 0,
      isActive: 1,
      expiresAt: data.expiresAt ? data.expiresAt.toISOString() : '',
      createdAt: now,
      updatedAt: now,
    });

    return rowToApiKey(id, this.store.getRow(TABLE, id));
  }

  async findById(id: string): Promise<ApiKey | null> {
    const row = this.store.getRow(TABLE, id);
    if (!row.name) return null;
    return rowToApiKey(id, row);
  }

  async findByHashedKey(hashedKey: string): Promise<ApiKey | null> {
    const rowIds = this.store.getRowIds(TABLE);
    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (row.hashedKey === hashedKey) {
        return rowToApiKey(id, row);
      }
    }
    return null;
  }

  async findByUserId(
    userId: string,
    options?: { skip?: number; take?: number; orderBy?: 'createdAt' }
  ): Promise<ApiKey[]> {
    const rowIds = this.store.getRowIds(TABLE);
    let results: ApiKey[] = [];

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (row.userId === userId) {
        results.push(rowToApiKey(id, row));
      }
    }

    if (options?.orderBy === 'createdAt') {
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    if (options?.skip) results = results.slice(options.skip);
    if (options?.take) results = results.slice(0, options.take);

    return results;
  }

  async countByUserId(userId: string, filter?: { isActive?: boolean }): Promise<number> {
    const rowIds = this.store.getRowIds(TABLE);
    let count = 0;

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (row.userId !== userId) continue;
      if (filter?.isActive !== undefined) {
        const active = row.isActive === 1;
        if (active !== filter.isActive) continue;
      }
      count++;
    }

    return count;
  }

  async update(
    id: string,
    data: Partial<Pick<ApiKey, 'name' | 'isActive' | 'lastUsedAt' | 'usageCount'>>
  ): Promise<ApiKey> {
    const row = this.store.getRow(TABLE, id);
    if (!row.name) throw new Error(`ApiKey ${id} not found`);

    if (data.name !== undefined) this.store.setCell(TABLE, id, 'name', data.name);
    if (data.isActive !== undefined) this.store.setCell(TABLE, id, 'isActive', data.isActive ? 1 : 0);
    if (data.lastUsedAt !== undefined) this.store.setCell(TABLE, id, 'lastUsedAt', data.lastUsedAt ? data.lastUsedAt.toISOString() : '');
    if (data.usageCount !== undefined) this.store.setCell(TABLE, id, 'usageCount', data.usageCount);
    this.store.setCell(TABLE, id, 'updatedAt', new Date().toISOString());

    return rowToApiKey(id, this.store.getRow(TABLE, id));
  }

  async delete(id: string): Promise<void> {
    this.store.delRow(TABLE, id);
  }
}
