import { createTestStore } from './helpers';
import { setStore, resetStore, getStore } from '@/lib/store/data-store';
import { OrganisationService } from '@/lib/services/organisation';
import { UserService } from '@/lib/services/user';

describe('OrganisationService', () => {
  let orgService: OrganisationService;
  let userService: UserService;
  let ownerId: string;
  let memberId: string;

  beforeEach(async () => {
    resetStore();
    setStore(createTestStore());
    orgService = new OrganisationService();
    userService = new UserService();

    const owner = await userService.createUser({ email: 'owner@example.com', role: 'CUSTOMER' });
    const member = await userService.createUser({ email: 'member@example.com', role: 'CUSTOMER' });
    ownerId = owner.id;
    memberId = member.id;
  });

  describe('createOrganisation', () => {
    it('creates org and adds owner as OWNER member', async () => {
      const org = await orgService.createOrganisation(ownerId, { name: 'test-org' });
      expect(org.name).toBe('test-org');
      expect(org.ownerId).toBe(ownerId);
      expect(org.memberCount).toBe(1);
      expect(org.isActive).toBe(true);
    });
  });

  describe('getOrganisationById / getOrganisationByName', () => {
    it('finds by id with member count', async () => {
      const org = await orgService.createOrganisation(ownerId, { name: 'my-org' });
      const found = await orgService.getOrganisationById(org.id);
      expect(found).not.toBeNull();
      expect(found!.memberCount).toBe(1);
    });

    it('finds by name with member count', async () => {
      await orgService.createOrganisation(ownerId, { name: 'named-org' });
      const found = await orgService.getOrganisationByName('named-org');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('named-org');
    });

    it('returns null for nonexistent', async () => {
      expect(await orgService.getOrganisationById('missing')).toBeNull();
      expect(await orgService.getOrganisationByName('missing')).toBeNull();
    });
  });

  describe('getUserOrganisations', () => {
    it('returns orgs where user is a member', async () => {
      await orgService.createOrganisation(ownerId, { name: 'org-1' });
      await orgService.createOrganisation(ownerId, { name: 'org-2' });

      const orgs = await orgService.getUserOrganisations(ownerId);
      expect(orgs).toHaveLength(2);
    });

    it('returns empty for user with no memberships', async () => {
      const orgs = await orgService.getUserOrganisations(memberId);
      expect(orgs).toEqual([]);
    });
  });

  describe('updateOrganisation', () => {
    it('allows owner to update', async () => {
      const org = await orgService.createOrganisation(ownerId, { name: 'old-name' });
      const updated = await orgService.updateOrganisation(org.id, ownerId, { name: 'new-name' });
      expect(updated.name).toBe('new-name');
    });

    it('rejects non-member update', async () => {
      const org = await orgService.createOrganisation(ownerId, { name: 'test-org' });
      await expect(
        orgService.updateOrganisation(org.id, memberId, { name: 'hacked' })
      ).rejects.toThrow('Insufficient permissions');
    });

    it('rejects MEMBER role update', async () => {
      const org = await orgService.createOrganisation(ownerId, { name: 'test-org' });
      const store = getStore();
      await store.organisationMembers.create({ userId: memberId, organisationId: org.id, role: 'MEMBER' });

      await expect(
        orgService.updateOrganisation(org.id, memberId, { name: 'hacked' })
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('deleteOrganisation', () => {
    it('soft deletes when called by owner', async () => {
      const org = await orgService.createOrganisation(ownerId, { name: 'to-delete' });
      await orgService.deleteOrganisation(org.id, ownerId);

      const found = await orgService.getOrganisationById(org.id);
      expect(found!.isActive).toBe(false);
    });

    it('rejects non-owner delete', async () => {
      const org = await orgService.createOrganisation(ownerId, { name: 'test-org' });
      await expect(
        orgService.deleteOrganisation(org.id, memberId)
      ).rejects.toThrow('Only the organisation owner');
    });
  });

  describe('getUserRole / isUserMember', () => {
    it('returns OWNER for org creator', async () => {
      const org = await orgService.createOrganisation(ownerId, { name: 'test-org' });
      expect(await orgService.getUserRole(ownerId, org.id)).toBe('OWNER');
      expect(await orgService.isUserMember(ownerId, org.id)).toBe(true);
    });

    it('returns null for non-member', async () => {
      const org = await orgService.createOrganisation(ownerId, { name: 'test-org' });
      expect(await orgService.getUserRole(memberId, org.id)).toBeNull();
      expect(await orgService.isUserMember(memberId, org.id)).toBe(false);
    });
  });

  describe('validateOrganisationName', () => {
    it('rejects duplicate active names', async () => {
      await orgService.createOrganisation(ownerId, { name: 'taken-name' });
      const result = await orgService.validateOrganisationName('taken-name');
      expect(result.isValid).toBe(false);
    });

    it('allows same name when excluded', async () => {
      const org = await orgService.createOrganisation(ownerId, { name: 'my-org' });
      const result = await orgService.validateOrganisationName('my-org', org.id);
      expect(result.isValid).toBe(true);
    });

    it('accepts available names', async () => {
      const result = await orgService.validateOrganisationName('available-name');
      expect(result.isValid).toBe(true);
    });
  });

  describe('getOrganisationMembers', () => {
    it('returns members with user data', async () => {
      const org = await orgService.createOrganisation(ownerId, { name: 'test-org' });
      const members = await orgService.getOrganisationMembers(org.id);
      expect(members).toHaveLength(1);
      expect(members[0].role).toBe('OWNER');
      expect(members[0].user).toBeDefined();
    });
  });
});
