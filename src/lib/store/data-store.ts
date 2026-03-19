import type { IUserRepository } from './repositories/user.repository';
import type { IOrganisationRepository, IOrganisationMemberRepository } from './repositories/organisation.repository';
import type { IApiKeyRepository } from './repositories/api-key.repository';
import type { IAuditLogRepository } from './repositories/audit-log.repository';
import type { IUserStorageQuotaRepository, IUserStorageMetricsRepository, IUserStorageActivityRepository } from './repositories/user-storage.repository';
import { createStore } from 'tinybase';
import { createFilePersister, type FilePersister } from 'tinybase/persisters/persister-file';
import { TinyBaseUserRepository } from './tinybase/user.tinybase';
import { TinyBaseOrganisationRepository, TinyBaseOrganisationMemberRepository } from './tinybase/organisation.tinybase';
import { TinyBaseApiKeyRepository } from './tinybase/api-key.tinybase';
import { TinyBaseAuditLogRepository } from './tinybase/audit-log.tinybase';
import { TinyBaseUserStorageQuotaRepository, TinyBaseUserStorageMetricsRepository, TinyBaseUserStorageActivityRepository } from './tinybase/user-storage.tinybase';
import path from 'path';
import fs from 'fs';

export interface DataStore {
  users: IUserRepository;
  organisations: IOrganisationRepository;
  organisationMembers: IOrganisationMemberRepository;
  apiKeys: IApiKeyRepository;
  auditLogs: IAuditLogRepository;
  storageQuotas: IUserStorageQuotaRepository;
  storageMetrics: IUserStorageMetricsRepository;
  storageActivity: IUserStorageActivityRepository;
  destroy(): Promise<void>;
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

let _store: DataStore | null = null;
let _initPromise: Promise<DataStore> | null = null;

async function createDataStore(): Promise<DataStore> {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const filePath = path.join(DATA_DIR, 'store.json');
  const tinyStore = createStore();
  const persister = createFilePersister(tinyStore, filePath);

  await persister.load();
  await persister.startAutoSave();

  return {
    users: new TinyBaseUserRepository(tinyStore),
    organisations: new TinyBaseOrganisationRepository(tinyStore),
    organisationMembers: new TinyBaseOrganisationMemberRepository(tinyStore),
    apiKeys: new TinyBaseApiKeyRepository(tinyStore),
    auditLogs: new TinyBaseAuditLogRepository(tinyStore),
    storageQuotas: new TinyBaseUserStorageQuotaRepository(tinyStore),
    storageMetrics: new TinyBaseUserStorageMetricsRepository(tinyStore),
    storageActivity: new TinyBaseUserStorageActivityRepository(tinyStore),
    async destroy() {
      await persister.destroy();
    },
  };
}

export async function getStoreAsync(): Promise<DataStore> {
  if (_store) return _store;
  if (!_initPromise) {
    _initPromise = createDataStore().then((store) => {
      _store = store;
      _initPromise = null;
      return store;
    });
  }
  return _initPromise;
}

export function getStore(): DataStore {
  if (!_store) {
    throw new Error(
      'DataStore not initialised. Call await getStoreAsync() first, or use getStoreAsync() directly.'
    );
  }
  return _store;
}

export function setStore(store: DataStore): void {
  _store = store;
}

export function resetStore(): void {
  _store = null;
  _initPromise = null;
}
