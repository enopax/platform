import type { ApiKey } from '../types';

export interface CreateApiKeyData {
  name: string;
  keyPreview: string;
  hashedKey: string;
  permissions: string[];
  userId: string;
  expiresAt?: Date;
}

export interface IApiKeyRepository {
  create(data: CreateApiKeyData): Promise<ApiKey>;
  findById(id: string): Promise<ApiKey | null>;
  findByHashedKey(hashedKey: string): Promise<ApiKey | null>;
  findByUserId(userId: string, options?: { skip?: number; take?: number; orderBy?: 'createdAt' }): Promise<ApiKey[]>;
  countByUserId(userId: string, filter?: { isActive?: boolean }): Promise<number>;
  update(id: string, data: Partial<Pick<ApiKey, 'name' | 'isActive' | 'lastUsedAt' | 'usageCount'>>): Promise<ApiKey>;
  delete(id: string): Promise<void>;
}
