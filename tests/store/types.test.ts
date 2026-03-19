import type {
  UserRole,
  OrganisationRole,
  ProjectStatus,
  ProjectPriority,
  JoinRequestStatus,
  MembershipEntity,
  MembershipAction,
  ResourceType,
  ResourceStatus,
  StorageTier,
  User,
  Organisation,
  OrganisationMember,
  Project,
  OrganisationJoinRequest,
  MembershipAuditLog,
  UserStorageMetrics,
  UserStorageActivity,
  UserFile,
  UserStorageQuota,
  Resource,
  ProjectResource,
  ApiKey,
} from '@/lib/store';

describe('Store types', () => {
  describe('Enum types', () => {
    it('UserRole accepts valid values', () => {
      const values: UserRole[] = ['GUEST', 'CUSTOMER', 'ADMIN'];
      expect(values).toHaveLength(3);
    });

    it('OrganisationRole accepts valid values', () => {
      const values: OrganisationRole[] = ['MEMBER', 'MANAGER', 'ADMIN', 'OWNER'];
      expect(values).toHaveLength(4);
    });

    it('ProjectStatus accepts valid values', () => {
      const values: ProjectStatus[] = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
      expect(values).toHaveLength(5);
    });

    it('ProjectPriority accepts valid values', () => {
      const values: ProjectPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      expect(values).toHaveLength(4);
    });

    it('JoinRequestStatus accepts valid values', () => {
      const values: JoinRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
      expect(values).toHaveLength(3);
    });

    it('MembershipEntity accepts valid values', () => {
      const values: MembershipEntity[] = ['ORGANISATION'];
      expect(values).toHaveLength(1);
    });

    it('MembershipAction accepts valid values', () => {
      const values: MembershipAction[] = ['ADDED', 'REMOVED', 'ROLE_CHANGED', 'PROMOTED', 'DEMOTED'];
      expect(values).toHaveLength(5);
    });

    it('ResourceType accepts valid values', () => {
      const values: ResourceType[] = ['COMPUTE', 'STORAGE', 'NETWORK', 'DATABASE', 'API', 'OTHER'];
      expect(values).toHaveLength(6);
    });

    it('ResourceStatus accepts valid values', () => {
      const values: ResourceStatus[] = ['PROVISIONING', 'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELETED'];
      expect(values).toHaveLength(5);
    });

    it('StorageTier accepts valid values', () => {
      const values: StorageTier[] = ['FREE_500MB', 'BASIC_5GB', 'PRO_50GB', 'ENTERPRISE_500GB', 'UNLIMITED'];
      expect(values).toHaveLength(5);
    });
  });

  describe('Model interfaces', () => {
    it('User has required fields', () => {
      const user: User = {
        id: 'test-id',
        firstname: 'John',
        lastname: 'Doe',
        name: 'John Doe',
        email: 'john@example.com',
        emailVerified: null,
        image: null,
        password: 'hashed',
        role: 'CUSTOMER',
        storageTier: 'FREE_500MB',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(user.id).toBe('test-id');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe('CUSTOMER');
    });

    it('Organisation has required fields', () => {
      const org: Organisation = {
        id: 'org-id',
        name: 'test-org',
        description: null,
        website: null,
        streetAddress: null,
        city: null,
        state: null,
        postalCode: null,
        country: 'United Kingdom',
        phone: null,
        email: null,
        logo: null,
        vatNumber: null,
        taxId: null,
        billingEmail: null,
        paymentMethods: null,
        subscriptionId: null,
        subscriptionTier: 'FREE',
        subscriptionEnds: null,
        isActive: true,
        maxProjects: 50,
        maxMembers: 100,
        maxTeams: 10,
        ownerId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(org.name).toBe('test-org');
      expect(org.isActive).toBe(true);
    });

    it('Project has required fields', () => {
      const project: Project = {
        id: 'proj-id',
        name: 'my-project',
        description: null,
        development: false,
        status: 'PLANNING',
        priority: 'MEDIUM',
        budget: null,
        currency: 'GBP',
        startDate: null,
        endDate: null,
        actualEndDate: null,
        progress: 0,
        repositoryUrl: null,
        documentationUrl: null,
        organisationId: 'org-id',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(project.status).toBe('PLANNING');
      expect(project.organisationId).toBe('org-id');
    });

    it('ApiKey has required fields', () => {
      const key: ApiKey = {
        id: 'key-id',
        name: 'My API Key',
        keyPreview: 'sk_test_...',
        hashedKey: 'hashed-value',
        permissions: ['read', 'write'],
        userId: 'user-id',
        lastUsedAt: null,
        usageCount: 0,
        isActive: true,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(key.permissions).toEqual(['read', 'write']);
      expect(key.isActive).toBe(true);
    });

    it('Resource has required fields', () => {
      const resource: Resource = {
        id: 'res-id',
        name: 'my-resource',
        description: null,
        type: 'COMPUTE',
        status: 'ACTIVE',
        configuration: null,
        endpoint: null,
        credentials: null,
        quotaLimit: null,
        currentUsage: BigInt(0),
        ownerId: 'user-id',
        organisationId: 'org-id',
        isPublic: false,
        tags: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      expect(resource.type).toBe('COMPUTE');
      expect(resource.tags).toEqual([]);
    });

    it('OrganisationMember has required fields', () => {
      const member: OrganisationMember = {
        id: 'member-id',
        userId: 'user-id',
        organisationId: 'org-id',
        role: 'MEMBER',
        joinedAt: new Date(),
        updatedAt: new Date(),
      };
      expect(member.role).toBe('MEMBER');
    });

    it('MembershipAuditLog has required fields', () => {
      const log: MembershipAuditLog = {
        id: 'log-id',
        entityType: 'ORGANISATION',
        entityId: 'org-id',
        userId: 'user-id',
        actorId: 'actor-id',
        action: 'ADDED',
        oldRole: null,
        newRole: 'MEMBER',
        reason: null,
        createdAt: new Date(),
      };
      expect(log.action).toBe('ADDED');
    });

    it('UserFile has required fields', () => {
      const file: UserFile = {
        id: 'file-id',
        userId: 'user-id',
        projectId: null,
        ipfsHash: 'Qm...',
        fileName: 'test.txt',
        fileSize: BigInt(1024),
        fileType: 'text/plain',
        uploadedAt: new Date(),
        isPinned: true,
        replicationCount: 3,
        nodeLocations: ['eu-west-1'],
        metadata: null,
        lastSyncAt: new Date(),
      };
      expect(file.isPinned).toBe(true);
      expect(file.nodeLocations).toHaveLength(1);
    });

    it('UserStorageQuota has required fields', () => {
      const quota: UserStorageQuota = {
        id: 'quota-id',
        userId: 'user-id',
        tier: 'FREE_500MB',
        allocatedBytes: BigInt(524288000),
        usedBytes: BigInt(0),
        lastUpdated: new Date(),
        tierUpdatedAt: null,
        tierUpdatedBy: null,
        subscriptionId: null,
        subscriptionEnds: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(quota.tier).toBe('FREE_500MB');
    });

    it('OrganisationJoinRequest has required fields', () => {
      const request: OrganisationJoinRequest = {
        id: 'req-id',
        userId: 'user-id',
        organisationId: 'org-id',
        status: 'PENDING',
        respondedBy: null,
        requestedAt: new Date(),
        respondedAt: null,
        updatedAt: new Date(),
      };
      expect(request.status).toBe('PENDING');
    });

    it('ProjectResource has required fields', () => {
      const pr: ProjectResource = {
        id: 'pr-id',
        projectId: 'proj-id',
        resourceId: 'res-id',
        allocatedBy: 'user-id',
        allocatedAt: new Date(),
        quotaLimit: null,
      };
      expect(pr.projectId).toBe('proj-id');
    });

    it('UserStorageMetrics has required fields', () => {
      const metrics: UserStorageMetrics = {
        id: 'metrics-id',
        userId: 'user-id',
        date: new Date(),
        totalFiles: 10,
        totalSize: BigInt(1024000),
        pinnedFiles: 5,
        pinnedSize: BigInt(512000),
        uploadCount: 3,
        downloadCount: 7,
        deleteCount: 1,
        documentFiles: 4,
        imageFiles: 3,
        videoFiles: 1,
        archiveFiles: 1,
        otherFiles: 1,
        avgResponseTime: 150,
        availabilityRate: 99.9,
      };
      expect(metrics.totalFiles).toBe(10);
    });

    it('UserStorageActivity has required fields', () => {
      const activity: UserStorageActivity = {
        id: 'activity-id',
        userId: 'user-id',
        action: 'upload',
        fileName: 'test.txt',
        fileSize: BigInt(1024),
        ipfsHash: 'Qm...',
        timestamp: new Date(),
        responseTime: 200,
        success: true,
        errorMessage: null,
      };
      expect(activity.action).toBe('upload');
      expect(activity.success).toBe(true);
    });
  });

  describe('DataStore', () => {
    it('getStore throws when not initialised', () => {
      jest.resetModules();
      jest.mock('tinybase', () => ({ createStore: jest.fn() }));
      jest.mock('tinybase/persisters/persister-file', () => ({ createFilePersister: jest.fn() }));
      const { getStore, resetStore } = require('@/lib/store/data-store');
      resetStore();
      expect(() => getStore()).toThrow('DataStore not initialised');
    });

    it('getStoreAsync resolves with apiKeys repository', async () => {
      jest.resetModules();
      const mockStore = {
        getRowIds: jest.fn().mockReturnValue([]),
        getRow: jest.fn().mockReturnValue({}),
        setRow: jest.fn(),
      };
      jest.mock('tinybase', () => ({ createStore: () => mockStore }));
      jest.mock('tinybase/persisters/persister-file', () => ({
        createFilePersister: () => ({
          load: jest.fn().mockResolvedValue(undefined),
          startAutoSave: jest.fn().mockResolvedValue(undefined),
          destroy: jest.fn().mockResolvedValue(undefined),
        }),
      }));
      const { getStoreAsync, resetStore } = require('@/lib/store/data-store');
      resetStore();
      const store = await getStoreAsync();
      expect(store).toBeDefined();
      expect(store.apiKeys).toBeDefined();
      expect(store.auditLogs).toBeDefined();
      expect(store.storageQuotas).toBeDefined();
      expect(store.storageMetrics).toBeDefined();
      expect(store.storageActivity).toBeDefined();
    });
  });
});
