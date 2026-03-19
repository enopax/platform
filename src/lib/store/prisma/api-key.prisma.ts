import { PrismaClient } from '@prisma/client';
import type { ApiKey } from '../types';
import type { IApiKeyRepository, CreateApiKeyData } from '../repositories/api-key.repository';

export class PrismaApiKeyRepository implements IApiKeyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateApiKeyData): Promise<ApiKey> {
    return await this.prisma.apiKey.create({
      data: {
        name: data.name,
        keyPreview: data.keyPreview,
        hashedKey: data.hashedKey,
        permissions: data.permissions,
        userId: data.userId,
        expiresAt: data.expiresAt ?? null,
        isActive: true,
      },
    });
  }

  async findById(id: string): Promise<ApiKey | null> {
    return await this.prisma.apiKey.findUnique({ where: { id } });
  }

  async findByHashedKey(hashedKey: string): Promise<ApiKey | null> {
    return await this.prisma.apiKey.findUnique({ where: { hashedKey } });
  }

  async findByUserId(
    userId: string,
    options?: { skip?: number; take?: number; orderBy?: 'createdAt' }
  ): Promise<ApiKey[]> {
    return await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: options?.orderBy ? { [options.orderBy]: 'desc' } : undefined,
      skip: options?.skip,
      take: options?.take,
    });
  }

  async countByUserId(userId: string, filter?: { isActive?: boolean }): Promise<number> {
    return await this.prisma.apiKey.count({
      where: {
        userId,
        ...(filter?.isActive !== undefined ? { isActive: filter.isActive } : {}),
      },
    });
  }

  async update(
    id: string,
    data: Partial<Pick<ApiKey, 'name' | 'isActive' | 'lastUsedAt' | 'usageCount'>>
  ): Promise<ApiKey> {
    return await this.prisma.apiKey.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.apiKey.delete({ where: { id } });
  }
}
