/**
 * Organisation Model Tests
 *
 * Comprehensive test suite for Organisation data access layer.
 * Tests CRUD operations, custom queries, and relationship navigation.
 */

import { organisationModel, Organisation, OrganisationRole } from '../organisation';
import { resetDB } from '../../tinybase/db';
import { resetNanoid } from '../../../../tests/__mocks__/nanoid';

describe('OrganisationModel', () => {
  beforeEach(async () => {
    // Reset database and ID generator before each test
    await resetDB();
    resetNanoid();
  });

  describe('CRUD Operations', () => {
    it('should create an organisation with auto-generated ID and timestamps', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        description: 'A test organisation',
        ownerId: 'user123',
      });

      expect(org.id).toBe('test-id-000001'); // Mock nanoid returns predictable IDs
      expect(org.name).toBe('Test Organisation');
      expect(org.description).toBe('A test organisation');
      expect(org.ownerId).toBe('user123');
      expect(org.createdAt).toBeInstanceOf(Date);
      expect(org.updatedAt).toBeInstanceOf(Date);
    });

    it('should create organisation with default values', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
      });

      expect(org.country).toBe('United Kingdom');
      expect(org.subscriptionTier).toBe('FREE');
      expect(org.isActive).toBe(true);
      expect(org.maxTeams).toBe(10);
      expect(org.maxProjects).toBe(50);
      expect(org.maxMembers).toBe(100);
    });

    it('should create organisation with custom default values', async () => {
      const org = await organisationModel.create({
        name: 'Premium Organisation',
        ownerId: 'user123',
        country: 'Germany',
        subscriptionTier: 'PREMIUM',
        isActive: false,
        maxTeams: 50,
        maxProjects: 200,
        maxMembers: 500,
      });

      expect(org.country).toBe('Germany');
      expect(org.subscriptionTier).toBe('PREMIUM');
      expect(org.isActive).toBe(false);
      expect(org.maxTeams).toBe(50);
      expect(org.maxProjects).toBe(200);
      expect(org.maxMembers).toBe(500);
    });

    it('should find organisation by ID', async () => {
      const created = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
      });

      const found = await organisationModel.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Organisation');
    });

    it('should return null for non-existent organisation', async () => {
      const found = await organisationModel.findById('non-existent');
      expect(found).toBeNull();
    });

    it('should update organisation', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        description: 'Original description',
        ownerId: 'user123',
      });

      const updated = await organisationModel.update(org.id, {
        description: 'Updated description',
        website: 'https://example.com',
      });

      expect(updated).not.toBeNull();
      expect(updated?.description).toBe('Updated description');
      expect(updated?.website).toBe('https://example.com');
      expect(updated?.name).toBe('Test Organisation'); // Unchanged
      expect(updated?.updatedAt?.getTime()).toBeGreaterThanOrEqual(org.updatedAt?.getTime() || 0);
    });

    it('should delete organisation', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
      });

      const deleted = await organisationModel.delete(org.id);
      expect(deleted).toBe(true);

      const found = await organisationModel.findById(org.id);
      expect(found).toBeNull();
    });
  });

  describe('Custom Query Methods', () => {
    it('should find organisation by name', async () => {
      await organisationModel.create({
        name: 'Acme Corporation',
        ownerId: 'user123',
      });

      const found = await organisationModel.findByName('Acme Corporation');

      expect(found).not.toBeNull();
      expect(found?.name).toBe('Acme Corporation');
    });

    it('should return null for non-existent name', async () => {
      const found = await organisationModel.findByName('Non-Existent Corp');
      expect(found).toBeNull();
    });

    it('should handle case-sensitive name search', async () => {
      await organisationModel.create({
        name: 'Acme Corporation',
        ownerId: 'user123',
      });

      const found = await organisationModel.findByName('acme corporation');
      expect(found).toBeNull(); // Case-sensitive
    });

    it('should find organisations by owner', async () => {
      await organisationModel.create({
        name: 'Org 1',
        ownerId: 'user123',
      });
      await organisationModel.create({
        name: 'Org 2',
        ownerId: 'user123',
      });
      await organisationModel.create({
        name: 'Org 3',
        ownerId: 'user456',
      });

      const orgs = await organisationModel.findByOwner('user123');

      expect(orgs).toHaveLength(2);
      expect(orgs.every(org => org.ownerId === 'user123')).toBe(true);
    });

    it('should find active organisations', async () => {
      await organisationModel.create({
        name: 'Active Org 1',
        ownerId: 'user123',
        isActive: true,
      });
      await organisationModel.create({
        name: 'Active Org 2',
        ownerId: 'user456',
        isActive: true,
      });
      await organisationModel.create({
        name: 'Inactive Org',
        ownerId: 'user789',
        isActive: false,
      });

      const activeOrgs = await organisationModel.findActive();

      expect(activeOrgs).toHaveLength(2);
      expect(activeOrgs.every(org => org.isActive === true)).toBe(true);
    });

    it('should find inactive organisations', async () => {
      await organisationModel.create({
        name: 'Active Org',
        ownerId: 'user123',
        isActive: true,
      });
      await organisationModel.create({
        name: 'Inactive Org 1',
        ownerId: 'user456',
        isActive: false,
      });
      await organisationModel.create({
        name: 'Inactive Org 2',
        ownerId: 'user789',
        isActive: false,
      });

      const inactiveOrgs = await organisationModel.findInactive();

      expect(inactiveOrgs).toHaveLength(2);
      expect(inactiveOrgs.every(org => org.isActive === false)).toBe(true);
    });

    it('should find organisations by subscription tier', async () => {
      await organisationModel.create({
        name: 'Free Org 1',
        ownerId: 'user123',
        subscriptionTier: 'FREE',
      });
      await organisationModel.create({
        name: 'Free Org 2',
        ownerId: 'user456',
        subscriptionTier: 'FREE',
      });
      await organisationModel.create({
        name: 'Premium Org',
        ownerId: 'user789',
        subscriptionTier: 'PREMIUM',
      });

      const freeOrgs = await organisationModel.findBySubscriptionTier('FREE');
      const premiumOrgs = await organisationModel.findBySubscriptionTier('PREMIUM');

      expect(freeOrgs).toHaveLength(2);
      expect(premiumOrgs).toHaveLength(1);
      expect(freeOrgs.every(org => org.subscriptionTier === 'FREE')).toBe(true);
    });

    it('should check if organisation name is available', async () => {
      await organisationModel.create({
        name: 'Existing Organisation',
        ownerId: 'user123',
      });

      const available1 = await organisationModel.isNameAvailable('New Organisation');
      const available2 = await organisationModel.isNameAvailable('Existing Organisation');

      expect(available1).toBe(true);
      expect(available2).toBe(false);
    });

    it('should allow checking name availability excluding specific ID', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
      });

      const available = await organisationModel.isNameAvailable('Test Organisation', org.id);
      expect(available).toBe(true); // Same name but excluded ID
    });
  });

  describe('Relationship Methods', () => {
    it('should get team IDs for organisation', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
      });

      const teamIds = await organisationModel.getTeamIds(org.id);

      expect(Array.isArray(teamIds)).toBe(true);
      // In testing environment, may return empty array
      expect(teamIds).toEqual([]);
    });

    it('should get project IDs for organisation', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
      });

      const projectIds = await organisationModel.getProjectIds(org.id);

      expect(Array.isArray(projectIds)).toBe(true);
      expect(projectIds).toEqual([]);
    });

    it('should get resource IDs for organisation', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
      });

      const resourceIds = await organisationModel.getResourceIds(org.id);

      expect(Array.isArray(resourceIds)).toBe(true);
      expect(resourceIds).toEqual([]);
    });
  });

  describe('Helper Methods', () => {
    it('should count organisations', async () => {
      await organisationModel.create({
        name: 'Org 1',
        ownerId: 'user123',
      });
      await organisationModel.create({
        name: 'Org 2',
        ownerId: 'user456',
      });

      const count = await organisationModel.count();
      expect(count).toBe(2);
    });

    it('should check if organisation exists', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
      });

      const exists1 = await organisationModel.exists(org.id);
      const exists2 = await organisationModel.exists('non-existent');

      expect(exists1).toBe(true);
      expect(exists2).toBe(false);
    });
  });

  describe('Complex Fields', () => {
    it('should handle address information', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
        streetAddress: '123 Main St',
        city: 'London',
        state: 'Greater London',
        postalCode: 'SW1A 1AA',
        country: 'United Kingdom',
      });

      expect(org.streetAddress).toBe('123 Main St');
      expect(org.city).toBe('London');
      expect(org.state).toBe('Greater London');
      expect(org.postalCode).toBe('SW1A 1AA');
      expect(org.country).toBe('United Kingdom');
    });

    it('should handle contact information', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
        phone: '+44 20 1234 5678',
        email: 'contact@example.com',
        logo: 'https://example.com/logo.png',
      });

      expect(org.phone).toBe('+44 20 1234 5678');
      expect(org.email).toBe('contact@example.com');
      expect(org.logo).toBe('https://example.com/logo.png');
    });

    it('should handle billing information', async () => {
      const org = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
        vatNumber: 'GB123456789',
        taxId: 'TAX123456',
        billingEmail: 'billing@example.com',
        paymentMethods: {
          cards: [
            { last4: '4242', brand: 'visa' }
          ]
        },
      });

      expect(org.vatNumber).toBe('GB123456789');
      expect(org.taxId).toBe('TAX123456');
      expect(org.billingEmail).toBe('billing@example.com');
      expect(org.paymentMethods).toEqual({
        cards: [{ last4: '4242', brand: 'visa' }]
      });
    });

    it('should handle subscription information', async () => {
      const subscriptionEnds = new Date('2025-12-31');
      const org = await organisationModel.create({
        name: 'Test Organisation',
        ownerId: 'user123',
        subscriptionId: 'sub_123456',
        subscriptionTier: 'PREMIUM',
        subscriptionEnds,
      });

      expect(org.subscriptionId).toBe('sub_123456');
      expect(org.subscriptionTier).toBe('PREMIUM');
      expect(org.subscriptionEnds).toBeInstanceOf(Date);
      expect(org.subscriptionEnds?.toISOString()).toBe(subscriptionEnds.toISOString());
    });
  });

  describe('Edge Cases', () => {
    it('should handle organisation with minimal data', async () => {
      const org = await organisationModel.create({
        name: 'Minimal Org',
        ownerId: 'user123',
      });

      expect(org.name).toBe('Minimal Org');
      expect(org.ownerId).toBe('user123');
      expect(org.description).toBeUndefined();
      expect(org.website).toBeUndefined();
    });

    it('should handle organisation with all fields', async () => {
      const subscriptionEnds = new Date('2025-12-31');
      const org = await organisationModel.create({
        name: 'Complete Org',
        description: 'A complete organisation',
        website: 'https://example.com',
        streetAddress: '123 Main St',
        city: 'London',
        state: 'Greater London',
        postalCode: 'SW1A 1AA',
        country: 'United Kingdom',
        phone: '+44 20 1234 5678',
        email: 'contact@example.com',
        logo: 'https://example.com/logo.png',
        vatNumber: 'GB123456789',
        taxId: 'TAX123456',
        billingEmail: 'billing@example.com',
        paymentMethods: { cards: [] },
        subscriptionId: 'sub_123456',
        subscriptionTier: 'PREMIUM',
        subscriptionEnds,
        isActive: true,
        maxTeams: 50,
        maxProjects: 200,
        maxMembers: 500,
        ownerId: 'user123',
      });

      expect(org.name).toBe('Complete Org');
      expect(org.description).toBe('A complete organisation');
      expect(org.website).toBe('https://example.com');
      expect(org.subscriptionTier).toBe('PREMIUM');
      expect(org.maxTeams).toBe(50);
    });
  });

  describe('OrganisationRole Enum', () => {
    it('should export OrganisationRole enum', () => {
      expect(OrganisationRole.MEMBER).toBe('MEMBER');
      expect(OrganisationRole.MANAGER).toBe('MANAGER');
      expect(OrganisationRole.ADMIN).toBe('ADMIN');
      expect(OrganisationRole.OWNER).toBe('OWNER');
    });

    it('should have all role values', () => {
      const roles = Object.values(OrganisationRole);
      expect(roles).toContain('MEMBER');
      expect(roles).toContain('MANAGER');
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('OWNER');
      expect(roles).toHaveLength(4);
    });
  });
});
