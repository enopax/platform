/**
 * Resource Model Tests
 *
 * Comprehensive test suite for Resource data access layer.
 */

import { resourceModel, ResourceType, ResourceStatus, type Resource } from '../resource';
import { resetDB } from '@/lib/tinybase/db';

// Test data directory
const TEST_DATA_DIR = '/tmp/tinybase-test-resource';

describe('ResourceModel', () => {
  beforeEach(async () => {
    // Reset database before each test
    await resetDB(TEST_DATA_DIR);
  });

  describe('CRUD Operations', () => {
    it('should create a resource with default values', async () => {
      const resource = await resourceModel.create({
        name: 'Storage Cluster',
        ownerId: 'user-1',
        organisationId: 'org-1',
      });

      expect(resource.id).toBeDefined();
      expect(resource.name).toBe('Storage Cluster');
      expect(resource.ownerId).toBe('user-1');
      expect(resource.organisationId).toBe('org-1');
      expect(resource.type).toBe(ResourceType.OTHER);
      expect(resource.status).toBe(ResourceStatus.ACTIVE);
      expect(resource.currentUsage).toBe(BigInt(0));
      expect(resource.isPublic).toBe(false);
      expect(resource.tags).toEqual([]);
      expect(resource.isActive).toBe(true);
      expect(resource.createdAt).toBeInstanceOf(Date);
      expect(resource.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a resource with custom values', async () => {
      const resource = await resourceModel.create({
        name: 'PostgreSQL Database',
        description: 'Production database',
        type: ResourceType.DATABASE,
        status: ResourceStatus.PROVISIONING,
        endpoint: 'postgres://db.example.com:5432',
        credentials: { username: 'admin', password: 'secret' },
        configuration: { version: '14', memory: '4GB' },
        quotaLimit: BigInt(1000000),
        currentUsage: BigInt(50000),
        ownerId: 'user-1',
        organisationId: 'org-1',
        isPublic: true,
        tags: ['production', 'critical'],
      });

      expect(resource.description).toBe('Production database');
      expect(resource.type).toBe(ResourceType.DATABASE);
      expect(resource.status).toBe(ResourceStatus.PROVISIONING);
      expect(resource.endpoint).toBe('postgres://db.example.com:5432');
      expect(resource.credentials).toEqual({ username: 'admin', password: 'secret' });
      expect(resource.configuration).toEqual({ version: '14', memory: '4GB' });
      expect(resource.quotaLimit).toBe(BigInt(1000000));
      expect(resource.currentUsage).toBe(BigInt(50000));
      expect(resource.isPublic).toBe(true);
      expect(resource.tags).toEqual(['production', 'critical']);
    });

    it('should find resource by ID', async () => {
      const created = await resourceModel.create({
        name: 'IPFS Node',
        ownerId: 'user-1',
        organisationId: 'org-1',
      });

      const found = await resourceModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('IPFS Node');
    });

    it('should update resource', async () => {
      const resource = await resourceModel.create({
        name: 'Storage Cluster',
        ownerId: 'user-1',
        organisationId: 'org-1',
        status: ResourceStatus.PROVISIONING,
      });

      const updated = await resourceModel.update(resource.id, {
        status: ResourceStatus.ACTIVE,
        endpoint: 'https://storage.example.com',
        currentUsage: BigInt(1000),
      });

      expect(updated?.status).toBe(ResourceStatus.ACTIVE);
      expect(updated?.endpoint).toBe('https://storage.example.com');
      expect(updated?.currentUsage).toBe(BigInt(1000));
      expect(updated?.updatedAt).toBeInstanceOf(Date);
      expect(updated?.updatedAt?.getTime()).toBeGreaterThanOrEqual(
        resource.updatedAt?.getTime() ?? 0
      );
    });

    it('should delete resource', async () => {
      const resource = await resourceModel.create({
        name: 'Temp Storage',
        ownerId: 'user-1',
        organisationId: 'org-1',
      });

      await resourceModel.delete(resource.id);

      const found = await resourceModel.findById(resource.id);
      expect(found).toBeNull();
    });
  });

  describe('Custom Query Methods', () => {
    beforeEach(async () => {
      // Create test resources
      await resourceModel.create({
        name: 'Storage-1',
        type: ResourceType.STORAGE,
        status: ResourceStatus.ACTIVE,
        ownerId: 'user-1',
        organisationId: 'org-1',
        isPublic: true,
        tags: ['production'],
      });

      await resourceModel.create({
        name: 'Storage-2',
        type: ResourceType.STORAGE,
        status: ResourceStatus.PROVISIONING,
        ownerId: 'user-1',
        organisationId: 'org-1',
        isPublic: false,
        tags: ['development'],
      });

      await resourceModel.create({
        name: 'Database-1',
        type: ResourceType.DATABASE,
        status: ResourceStatus.ACTIVE,
        ownerId: 'user-2',
        organisationId: 'org-1',
        isPublic: true,
        tags: ['production', 'critical'],
      });

      await resourceModel.create({
        name: 'Database-2',
        type: ResourceType.DATABASE,
        status: ResourceStatus.INACTIVE,
        ownerId: 'user-2',
        organisationId: 'org-2',
        isPublic: false,
        tags: ['testing'],
      });
    });

    it('should find resources by organisation', async () => {
      const resources = await resourceModel.findByOrganisation('org-1');
      expect(resources).toHaveLength(3);
      expect(resources.every((r) => r.organisationId === 'org-1')).toBe(true);
    });

    it('should find resource by name in organisation', async () => {
      const resource = await resourceModel.findByNameInOrganisation('Storage-1', 'org-1');
      expect(resource).toBeDefined();
      expect(resource?.name).toBe('Storage-1');
      expect(resource?.organisationId).toBe('org-1');
    });

    it('should return null when resource name not found in organisation', async () => {
      const resource = await resourceModel.findByNameInOrganisation('NonExistent', 'org-1');
      expect(resource).toBeNull();
    });

    it('should find resources by owner', async () => {
      const resources = await resourceModel.findByOwner('user-1');
      expect(resources).toHaveLength(2);
      expect(resources.every((r) => r.ownerId === 'user-1')).toBe(true);
    });

    it('should find resources by type', async () => {
      const storageResources = await resourceModel.findByType(ResourceType.STORAGE);
      expect(storageResources).toHaveLength(2);
      expect(storageResources.every((r) => r.type === ResourceType.STORAGE)).toBe(true);

      const databaseResources = await resourceModel.findByType(ResourceType.DATABASE);
      expect(databaseResources).toHaveLength(2);
      expect(databaseResources.every((r) => r.type === ResourceType.DATABASE)).toBe(true);
    });

    it('should find resources by status', async () => {
      const activeResources = await resourceModel.findByStatus(ResourceStatus.ACTIVE);
      expect(activeResources).toHaveLength(2);
      expect(activeResources.every((r) => r.status === ResourceStatus.ACTIVE)).toBe(true);

      const provisioningResources = await resourceModel.findByStatus(
        ResourceStatus.PROVISIONING
      );
      expect(provisioningResources).toHaveLength(1);
      expect(provisioningResources[0].name).toBe('Storage-2');
    });

    it('should find resources by organisation and status', async () => {
      const resources = await resourceModel.findByOrganisationAndStatus(
        'org-1',
        ResourceStatus.ACTIVE
      );
      expect(resources).toHaveLength(2);
      expect(resources.every((r) => r.organisationId === 'org-1')).toBe(true);
      expect(resources.every((r) => r.status === ResourceStatus.ACTIVE)).toBe(true);
    });

    it('should find resources by organisation and type', async () => {
      const resources = await resourceModel.findByOrganisationAndType(
        'org-1',
        ResourceType.STORAGE
      );
      expect(resources).toHaveLength(2);
      expect(resources.every((r) => r.organisationId === 'org-1')).toBe(true);
      expect(resources.every((r) => r.type === ResourceType.STORAGE)).toBe(true);
    });

    it('should find active resources', async () => {
      const resources = await resourceModel.findActive();
      expect(resources).toHaveLength(4); // All have isActive: true by default
      expect(resources.every((r) => r.isActive === true)).toBe(true);
    });

    it('should find inactive resources', async () => {
      // Create an inactive resource
      await resourceModel.create({
        name: 'Inactive Resource',
        ownerId: 'user-1',
        organisationId: 'org-1',
        isActive: false,
      });

      const resources = await resourceModel.findInactive();
      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('Inactive Resource');
    });

    it('should find public resources', async () => {
      const resources = await resourceModel.findPublic();
      expect(resources).toHaveLength(2);
      expect(resources.every((r) => r.isPublic === true)).toBe(true);
    });

    it('should find private resources', async () => {
      const resources = await resourceModel.findPrivate();
      expect(resources).toHaveLength(2);
      expect(resources.every((r) => r.isPublic === false)).toBe(true);
    });

    it('should find resources by tag', async () => {
      const productionResources = await resourceModel.findByTag('production');
      expect(productionResources).toHaveLength(2);
      expect(productionResources.every((r) => r.tags?.includes('production'))).toBe(true);

      const criticalResources = await resourceModel.findByTag('critical');
      expect(criticalResources).toHaveLength(1);
      expect(criticalResources[0].name).toBe('Database-1');
    });

    it('should find provisioning resources', async () => {
      const resources = await resourceModel.findProvisioning();
      expect(resources).toHaveLength(1);
      expect(resources[0].status).toBe(ResourceStatus.PROVISIONING);
    });

    it('should find resources in maintenance', async () => {
      await resourceModel.create({
        name: 'Maintenance Resource',
        status: ResourceStatus.MAINTENANCE,
        ownerId: 'user-1',
        organisationId: 'org-1',
      });

      const resources = await resourceModel.findInMaintenance();
      expect(resources).toHaveLength(1);
      expect(resources[0].status).toBe(ResourceStatus.MAINTENANCE);
    });

    it('should find soft-deleted resources', async () => {
      await resourceModel.create({
        name: 'Deleted Resource',
        ownerId: 'user-1',
        organisationId: 'org-1',
        deletedAt: new Date(),
      });

      const resources = await resourceModel.findDeleted();
      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('Deleted Resource');
      expect(resources[0].deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('Helper Methods', () => {
    beforeEach(async () => {
      await resourceModel.create({
        name: 'Existing Resource',
        ownerId: 'user-1',
        organisationId: 'org-1',
      });
    });

    it('should check if resource name is available', async () => {
      const available = await resourceModel.isNameAvailable('New Resource', 'org-1');
      expect(available).toBe(true);
    });

    it('should return false when resource name already exists', async () => {
      const available = await resourceModel.isNameAvailable('Existing Resource', 'org-1');
      expect(available).toBe(false);
    });

    it('should allow same name in different organisation', async () => {
      const available = await resourceModel.isNameAvailable('Existing Resource', 'org-2');
      expect(available).toBe(true);
    });

    it('should exclude resource ID when checking availability (for updates)', async () => {
      const resource = await resourceModel.findByNameInOrganisation(
        'Existing Resource',
        'org-1'
      );
      expect(resource).toBeDefined();

      const available = await resourceModel.isNameAvailable(
        'Existing Resource',
        'org-1',
        resource!.id
      );
      expect(available).toBe(true);
    });

    it('should calculate usage percentage', async () => {
      const resource = await resourceModel.create({
        name: 'Limited Resource',
        ownerId: 'user-1',
        organisationId: 'org-1',
        quotaLimit: BigInt(1000),
        currentUsage: BigInt(250),
      });

      const percentage = await resourceModel.getUsagePercentage(resource.id);
      expect(percentage).toBe(25);
    });

    it('should return null when no quota limit set', async () => {
      const resource = await resourceModel.create({
        name: 'Unlimited Resource',
        ownerId: 'user-1',
        organisationId: 'org-1',
      });

      const percentage = await resourceModel.getUsagePercentage(resource.id);
      expect(percentage).toBeNull();
    });

    it('should return null when quota limit is zero', async () => {
      const resource = await resourceModel.create({
        name: 'Zero Limit Resource',
        ownerId: 'user-1',
        organisationId: 'org-1',
        quotaLimit: BigInt(0),
        currentUsage: BigInt(100),
      });

      const percentage = await resourceModel.getUsagePercentage(resource.id);
      expect(percentage).toBeNull();
    });

    it('should count resources', async () => {
      const count = await resourceModel.count();
      expect(count).toBe(1);

      await resourceModel.create({
        name: 'Resource 2',
        ownerId: 'user-1',
        organisationId: 'org-1',
      });

      const newCount = await resourceModel.count();
      expect(newCount).toBe(2);
    });

    it('should check if resource exists', async () => {
      const resource = await resourceModel.findByNameInOrganisation(
        'Existing Resource',
        'org-1'
      );
      expect(resource).toBeDefined();

      const exists = await resourceModel.exists(resource!.id);
      expect(exists).toBe(true);

      const notExists = await resourceModel.exists('non-existent-id');
      expect(notExists).toBe(false);
    });
  });

  describe('Relationship Methods', () => {
    it('should return empty array for project IDs (placeholder)', async () => {
      const resource = await resourceModel.create({
        name: 'Test Resource',
        ownerId: 'user-1',
        organisationId: 'org-1',
      });

      const projectIds = await resourceModel.getProjectIds(resource.id);
      expect(projectIds).toEqual([]);
    });
  });

  describe('All ResourceType Enum Values', () => {
    it('should create resources with all ResourceType values', async () => {
      const types = [
        ResourceType.COMPUTE,
        ResourceType.STORAGE,
        ResourceType.NETWORK,
        ResourceType.DATABASE,
        ResourceType.API,
        ResourceType.OTHER,
      ];

      for (const type of types) {
        const resource = await resourceModel.create({
          name: `${type} Resource`,
          type,
          ownerId: 'user-1',
          organisationId: 'org-1',
        });

        expect(resource.type).toBe(type);
      }

      const count = await resourceModel.count();
      expect(count).toBe(types.length);
    });
  });

  describe('All ResourceStatus Enum Values', () => {
    it('should create resources with all ResourceStatus values', async () => {
      const statuses = [
        ResourceStatus.PROVISIONING,
        ResourceStatus.ACTIVE,
        ResourceStatus.INACTIVE,
        ResourceStatus.MAINTENANCE,
        ResourceStatus.DELETED,
      ];

      for (const status of statuses) {
        const resource = await resourceModel.create({
          name: `${status} Resource`,
          status,
          ownerId: 'user-1',
          organisationId: 'org-1',
        });

        expect(resource.status).toBe(status);
      }

      const count = await resourceModel.count();
      expect(count).toBe(statuses.length);
    });
  });

  describe('BigInt Handling', () => {
    it('should handle BigInt values correctly', async () => {
      const largeQuota = BigInt('9223372036854775807'); // Max BigInt (2^63 - 1)
      const largeUsage = BigInt('1000000000000'); // 1 trillion

      const resource = await resourceModel.create({
        name: 'Big Numbers Resource',
        ownerId: 'user-1',
        organisationId: 'org-1',
        quotaLimit: largeQuota,
        currentUsage: largeUsage,
      });

      expect(resource.quotaLimit).toBe(largeQuota);
      expect(resource.currentUsage).toBe(largeUsage);

      const found = await resourceModel.findById(resource.id);
      expect(found?.quotaLimit).toBe(largeQuota);
      expect(found?.currentUsage).toBe(largeUsage);
    });
  });

  describe('Edge Cases', () => {
    it('should handle resources with minimal data', async () => {
      const resource = await resourceModel.create({
        name: 'Minimal',
        ownerId: 'user-1',
        organisationId: 'org-1',
      });

      expect(resource.id).toBeDefined();
      expect(resource.name).toBe('Minimal');
      expect(resource.description).toBeUndefined();
      expect(resource.endpoint).toBeUndefined();
      expect(resource.credentials).toBeUndefined();
      expect(resource.configuration).toBeUndefined();
    });

    it('should handle resources with null optional fields', async () => {
      const resource = await resourceModel.create({
        name: 'Null Fields',
        description: null,
        endpoint: null,
        credentials: null,
        configuration: null,
        quotaLimit: null,
        deletedAt: null,
        ownerId: 'user-1',
        organisationId: 'org-1',
      });

      expect(resource.description).toBeNull();
      expect(resource.endpoint).toBeNull();
      expect(resource.credentials).toBeNull();
      expect(resource.configuration).toBeNull();
      expect(resource.quotaLimit).toBeNull();
      expect(resource.deletedAt).toBeNull();
    });

    it('should handle empty tags array', async () => {
      const resource = await resourceModel.create({
        name: 'No Tags',
        ownerId: 'user-1',
        organisationId: 'org-1',
        tags: [],
      });

      expect(resource.tags).toEqual([]);
    });

    it('should handle large tags array', async () => {
      const tags = Array.from({ length: 100 }, (_, i) => `tag-${i}`);
      const resource = await resourceModel.create({
        name: 'Many Tags',
        ownerId: 'user-1',
        organisationId: 'org-1',
        tags,
      });

      expect(resource.tags).toHaveLength(100);
      expect(resource.tags).toEqual(tags);
    });

    it('should handle complex configuration JSON', async () => {
      const config = {
        version: '1.0',
        settings: {
          memory: '8GB',
          cpu: 4,
          storage: {
            type: 'SSD',
            size: '100GB',
            iops: 3000,
          },
        },
        features: ['backup', 'replication', 'monitoring'],
        metadata: {
          created: '2025-12-11',
          region: 'eu-west-1',
        },
      };

      const resource = await resourceModel.create({
        name: 'Complex Config',
        ownerId: 'user-1',
        organisationId: 'org-1',
        configuration: config,
      });

      expect(resource.configuration).toEqual(config);

      const found = await resourceModel.findById(resource.id);
      expect(found?.configuration).toEqual(config);
    });
  });
});
