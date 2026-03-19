import type { IApiKeyRepository } from './repositories/api-key.repository';
import { prisma } from '@/lib/prisma';
import { PrismaApiKeyRepository } from './prisma/api-key.prisma';

export interface DataStore {
  apiKeys: IApiKeyRepository;
}

let _store: DataStore | null = null;

export function getStore(): DataStore {
  if (!_store) {
    _store = {
      apiKeys: new PrismaApiKeyRepository(prisma),
    };
  }
  return _store;
}

export function resetStore(): void {
  _store = null;
}
