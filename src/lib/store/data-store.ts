import type { IUserRepository } from './repositories/user.repository';
import type { IOrganisationRepository, IOrganisationMemberRepository } from './repositories/organisation.repository';
import type { IProjectRepository } from './repositories/project.repository';
import type { IApiKeyRepository } from './repositories/api-key.repository';
import type { IResourceRepository, IProjectResourceRepository } from './repositories/resource.repository';
import type { IAuditLogRepository } from './repositories/audit-log.repository';
import type { IJoinRequestRepository } from './repositories/join-request.repository';
import type { IUserFileRepository } from './repositories/user-file.repository';
import type { IUserStorageQuotaRepository, IUserStorageMetricsRepository, IUserStorageActivityRepository } from './repositories/user-storage.repository';

export interface DataStoreRepositories {
  users: IUserRepository;
  organisations: IOrganisationRepository;
  organisationMembers: IOrganisationMemberRepository;
  projects: IProjectRepository;
  apiKeys: IApiKeyRepository;
  resources: IResourceRepository;
  projectResources: IProjectResourceRepository;
  auditLogs: IAuditLogRepository;
  joinRequests: IJoinRequestRepository;
  userFiles: IUserFileRepository;
  storageQuotas: IUserStorageQuotaRepository;
  storageMetrics: IUserStorageMetricsRepository;
  storageActivity: IUserStorageActivityRepository;
}

let _store: DataStoreRepositories | null = null;

export function initStore(repositories: DataStoreRepositories): void {
  _store = repositories;
}

export function getStore(): DataStoreRepositories {
  if (!_store) {
    throw new Error('DataStore not initialised. Call initStore() first.');
  }
  return _store;
}
