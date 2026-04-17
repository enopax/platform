import { createStore } from 'tinybase';
import { TinyBaseUserRepository } from '@/lib/store/tinybase/user.tinybase';
import { TinyBaseOrganisationRepository, TinyBaseOrganisationMemberRepository } from '@/lib/store/tinybase/organisation.tinybase';
import { TinyBaseProjectRepository } from '@/lib/store/tinybase/project.tinybase';
import { TinyBaseApiKeyRepository } from '@/lib/store/tinybase/api-key.tinybase';
import { TinyBaseAuditLogRepository } from '@/lib/store/tinybase/audit-log.tinybase';
import { TinyBaseJoinRequestRepository } from '@/lib/store/tinybase/join-request.tinybase';
import { TinyBaseInvitationRepository } from '@/lib/store/tinybase/invitation.tinybase';
import { TinyBaseResourceRepository, TinyBaseProjectResourceRepository } from '@/lib/store/tinybase/resource.tinybase';
import { TinyBaseUserFileRepository } from '@/lib/store/tinybase/user-file.tinybase';
import { TinyBaseUserStorageQuotaRepository, TinyBaseUserStorageMetricsRepository, TinyBaseUserStorageActivityRepository } from '@/lib/store/tinybase/user-storage.tinybase';
import { TinyBaseTeamRepository, TinyBaseTeamMemberRepository } from '@/lib/store/tinybase/team.tinybase';
import { TinyBaseProjectAccessRepository } from '@/lib/store/tinybase/project-access.tinybase';
import { TinyBaseNamespaceRepository } from '@/lib/store/tinybase/namespace.tinybase';
import type { DataStore } from '@/lib/store/data-store';

export function createTestStore(): DataStore {
  const store = createStore();
  return {
    users: new TinyBaseUserRepository(store),
    organisations: new TinyBaseOrganisationRepository(store),
    organisationMembers: new TinyBaseOrganisationMemberRepository(store),
    projects: new TinyBaseProjectRepository(store),
    resources: new TinyBaseResourceRepository(store),
    projectResources: new TinyBaseProjectResourceRepository(store),
    apiKeys: new TinyBaseApiKeyRepository(store),
    auditLogs: new TinyBaseAuditLogRepository(store),
    joinRequests: new TinyBaseJoinRequestRepository(store),
    invitations: new TinyBaseInvitationRepository(store),
    userFiles: new TinyBaseUserFileRepository(store),
    storageQuotas: new TinyBaseUserStorageQuotaRepository(store),
    storageMetrics: new TinyBaseUserStorageMetricsRepository(store),
    storageActivity: new TinyBaseUserStorageActivityRepository(store),
    namespaces: new TinyBaseNamespaceRepository(store),
    teams: new TinyBaseTeamRepository(store),
    teamMembers: new TinyBaseTeamMemberRepository(store),
    projectAccess: new TinyBaseProjectAccessRepository(store),
    async destroy() {},
  };
}
