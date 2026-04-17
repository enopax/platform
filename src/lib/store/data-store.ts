import type { IUserRepository } from './repositories/user.repository';
import type { IOrganisationRepository, IOrganisationMemberRepository } from './repositories/organisation.repository';
import type { IProjectRepository } from './repositories/project.repository';
import type { IApiKeyRepository } from './repositories/api-key.repository';
import type { IResourceRepository, IProjectResourceRepository } from './repositories/resource.repository';
import type { IUserFileRepository } from './repositories/user-file.repository';
import type { IAuditLogRepository } from './repositories/audit-log.repository';
import type { IJoinRequestRepository } from './repositories/join-request.repository';
import type { IInvitationRepository } from './repositories/invitation.repository';
import type { IUserStorageQuotaRepository, IUserStorageMetricsRepository, IUserStorageActivityRepository } from './repositories/user-storage.repository';
import type { ITeamRepository, ITeamMemberRepository } from './repositories/team.repository';
import type { IProjectAccessRepository } from './repositories/project-access.repository';
import type { INamespaceRepository } from './repositories/namespace.repository';
import { createStore } from 'tinybase';
import { FileRecordPersister } from './tinybase/file-record-persister';
import { TinyBaseUserRepository } from './tinybase/user.tinybase';
import { TinyBaseOrganisationRepository, TinyBaseOrganisationMemberRepository } from './tinybase/organisation.tinybase';
import { TinyBaseApiKeyRepository } from './tinybase/api-key.tinybase';
import { TinyBaseAuditLogRepository } from './tinybase/audit-log.tinybase';
import { TinyBaseProjectRepository } from './tinybase/project.tinybase';
import { TinyBaseResourceRepository, TinyBaseProjectResourceRepository } from './tinybase/resource.tinybase';
import { TinyBaseUserFileRepository } from './tinybase/user-file.tinybase';
import { TinyBaseJoinRequestRepository } from './tinybase/join-request.tinybase';
import { TinyBaseInvitationRepository } from './tinybase/invitation.tinybase';
import { TinyBaseUserStorageQuotaRepository, TinyBaseUserStorageMetricsRepository, TinyBaseUserStorageActivityRepository } from './tinybase/user-storage.tinybase';
import { TinyBaseTeamRepository, TinyBaseTeamMemberRepository } from './tinybase/team.tinybase';
import { TinyBaseProjectAccessRepository } from './tinybase/project-access.tinybase';
import { TinyBaseNamespaceRepository } from './tinybase/namespace.tinybase';
import path from 'path';

export interface DataStore {
  users: IUserRepository;
  organisations: IOrganisationRepository;
  organisationMembers: IOrganisationMemberRepository;
  projects: IProjectRepository;
  resources: IResourceRepository;
  projectResources: IProjectResourceRepository;
  userFiles: IUserFileRepository;
  apiKeys: IApiKeyRepository;
  auditLogs: IAuditLogRepository;
  joinRequests: IJoinRequestRepository;
  invitations: IInvitationRepository;
  storageQuotas: IUserStorageQuotaRepository;
  storageMetrics: IUserStorageMetricsRepository;
  storageActivity: IUserStorageActivityRepository;
  namespaces: INamespaceRepository;
  teams: ITeamRepository;
  teamMembers: ITeamMemberRepository;
  projectAccess: IProjectAccessRepository;
  destroy(): Promise<void>;
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

const TABLE_CONFIG = [
  { tableName: 'users', indexes: [{ name: 'email', cellId: 'email' }] },
  { tableName: 'organisations', indexes: [{ name: 'name', cellId: 'name' }] },
  { tableName: 'organisation-members', indexes: [{ name: 'userId', cellId: 'userId' }, { name: 'organisationId', cellId: 'organisationId' }] },
  { tableName: 'projects', indexes: [{ name: 'organisationId', cellId: 'organisationId' }] },
  { tableName: 'resources', indexes: [{ name: 'organisationId', cellId: 'organisationId' }] },
  { tableName: 'project-resources', indexes: [{ name: 'projectId', cellId: 'projectId' }, { name: 'resourceId', cellId: 'resourceId' }] },
  { tableName: 'api-keys', indexes: [{ name: 'userId', cellId: 'userId' }, { name: 'hashedKey', cellId: 'hashedKey' }] },
  { tableName: 'audit-logs' },
  { tableName: 'join-requests', indexes: [{ name: 'organisationId', cellId: 'organisationId' }] },
  { tableName: 'organisation-invitations', indexes: [{ name: 'organisationId', cellId: 'organisationId' }, { name: 'token', cellId: 'token' }] },
  { tableName: 'user-files', indexes: [{ name: 'userId', cellId: 'userId' }, { name: 'projectId', cellId: 'projectId' }] },
  { tableName: 'storage-quotas', indexes: [{ name: 'userId', cellId: 'userId' }] },
  { tableName: 'storage-metrics' },
  { tableName: 'storage-activity' },
  { tableName: 'namespaces', indexes: [{ name: 'slug', cellId: 'slug' }] },
  { tableName: 'teams', indexes: [{ name: 'organisationId', cellId: 'organisationId' }] },
  { tableName: 'team-members', indexes: [{ name: 'teamId', cellId: 'teamId' }, { name: 'userId', cellId: 'userId' }] },
  { tableName: 'project-access', indexes: [{ name: 'projectId', cellId: 'projectId' }, { name: 'teamId', cellId: 'teamId' }] },
];

let _store: DataStore | null = null;
let _initPromise: Promise<DataStore> | null = null;

async function createDataStore(): Promise<DataStore> {
  const tinyStore = createStore();
  const persister = new FileRecordPersister(tinyStore, DATA_DIR, TABLE_CONFIG);

  await persister.load();
  persister.startAutoSave();

  return {
    users: new TinyBaseUserRepository(tinyStore, persister),
    organisations: new TinyBaseOrganisationRepository(tinyStore, persister),
    organisationMembers: new TinyBaseOrganisationMemberRepository(tinyStore, persister),
    projects: new TinyBaseProjectRepository(tinyStore, persister),
    resources: new TinyBaseResourceRepository(tinyStore, persister),
    projectResources: new TinyBaseProjectResourceRepository(tinyStore, persister),
    userFiles: new TinyBaseUserFileRepository(tinyStore, persister),
    apiKeys: new TinyBaseApiKeyRepository(tinyStore, persister),
    auditLogs: new TinyBaseAuditLogRepository(tinyStore),
    joinRequests: new TinyBaseJoinRequestRepository(tinyStore, persister),
    invitations: new TinyBaseInvitationRepository(tinyStore, persister),
    storageQuotas: new TinyBaseUserStorageQuotaRepository(tinyStore),
    storageMetrics: new TinyBaseUserStorageMetricsRepository(tinyStore),
    storageActivity: new TinyBaseUserStorageActivityRepository(tinyStore),
    namespaces: new TinyBaseNamespaceRepository(tinyStore, persister),
    teams: new TinyBaseTeamRepository(tinyStore, persister),
    teamMembers: new TinyBaseTeamMemberRepository(tinyStore, persister),
    projectAccess: new TinyBaseProjectAccessRepository(tinyStore, persister),
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
