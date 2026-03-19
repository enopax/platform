import { createStore } from 'tinybase';
import { TinyBaseOrganisationRepository, TinyBaseOrganisationMemberRepository } from '@/lib/store/tinybase/organisation.tinybase';
import { TinyBaseUserRepository } from '@/lib/store/tinybase/user.tinybase';

describe('TinyBaseOrganisationRepository', () => {
  let orgRepo: TinyBaseOrganisationRepository;
  let memberRepo: TinyBaseOrganisationMemberRepository;

  beforeEach(() => {
    const store = createStore();
    orgRepo = new TinyBaseOrganisationRepository(store);
    memberRepo = new TinyBaseOrganisationMemberRepository(store);
  });

  describe('create', () => {
    it('creates an organisation with defaults', async () => {
      const org = await orgRepo.create({ name: 'test-org', ownerId: 'user-1' });
      expect(org.id).toBeDefined();
      expect(org.name).toBe('test-org');
      expect(org.ownerId).toBe('user-1');
      expect(org.isActive).toBe(true);
      expect(org.country).toBe('United Kingdom');
      expect(org.maxProjects).toBe(50);
    });
  });

  describe('findById', () => {
    it('returns org when found', async () => {
      const created = await orgRepo.create({ name: 'test-org', ownerId: 'user-1' });
      const found = await orgRepo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.name).toBe('test-org');
    });

    it('returns null for missing id', async () => {
      expect(await orgRepo.findById('missing')).toBeNull();
    });
  });

  describe('findByName', () => {
    it('returns org by name', async () => {
      await orgRepo.create({ name: 'my-org', ownerId: 'user-1' });
      const found = await orgRepo.findByName('my-org');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('my-org');
    });

    it('returns null for unknown name', async () => {
      expect(await orgRepo.findByName('unknown')).toBeNull();
    });
  });

  describe('findByIdWithMemberCount', () => {
    it('returns org with member count', async () => {
      const org = await orgRepo.create({ name: 'test-org', ownerId: 'user-1' });
      await memberRepo.create({ userId: 'user-1', organisationId: org.id, role: 'OWNER' });
      await memberRepo.create({ userId: 'user-2', organisationId: org.id, role: 'MEMBER' });

      const found = await orgRepo.findByIdWithMemberCount(org.id);
      expect(found).not.toBeNull();
      expect(found!.memberCount).toBe(2);
    });
  });

  describe('update', () => {
    it('updates name and description', async () => {
      const org = await orgRepo.create({ name: 'old-name', ownerId: 'user-1' });
      const updated = await orgRepo.update(org.id, { name: 'new-name', description: 'Updated' });
      expect(updated.name).toBe('new-name');
      expect(updated.description).toBe('Updated');
    });
  });

  describe('search', () => {
    it('finds orgs by name (case-insensitive)', async () => {
      await orgRepo.create({ name: 'Alpha Corp', ownerId: 'u1' });
      await orgRepo.create({ name: 'Beta Inc', ownerId: 'u2' });

      const results = await orgRepo.search('alpha');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alpha Corp');
    });

    it('respects limit', async () => {
      for (let i = 0; i < 5; i++) {
        await orgRepo.create({ name: `org-${i}`, ownerId: 'u1' });
      }
      const results = await orgRepo.search('org', 3);
      expect(results).toHaveLength(3);
    });
  });

  describe('findActiveByName', () => {
    it('finds active org by name', async () => {
      await orgRepo.create({ name: 'active-org', ownerId: 'u1' });
      const found = await orgRepo.findActiveByName('active-org');
      expect(found).not.toBeNull();
    });

    it('excludes specified id', async () => {
      const org = await orgRepo.create({ name: 'my-org', ownerId: 'u1' });
      const found = await orgRepo.findActiveByName('my-org', org.id);
      expect(found).toBeNull();
    });
  });
});

describe('TinyBaseOrganisationMemberRepository', () => {
  let orgRepo: TinyBaseOrganisationRepository;
  let memberRepo: TinyBaseOrganisationMemberRepository;

  beforeEach(() => {
    const store = createStore();
    orgRepo = new TinyBaseOrganisationRepository(store);
    memberRepo = new TinyBaseOrganisationMemberRepository(store);
  });

  describe('create', () => {
    it('creates a membership', async () => {
      const org = await orgRepo.create({ name: 'org', ownerId: 'u1' });
      const member = await memberRepo.create({ userId: 'u1', organisationId: org.id, role: 'OWNER' });
      expect(member.userId).toBe('u1');
      expect(member.role).toBe('OWNER');
    });
  });

  describe('findByUserAndOrg', () => {
    it('returns membership when found', async () => {
      const org = await orgRepo.create({ name: 'org', ownerId: 'u1' });
      await memberRepo.create({ userId: 'u1', organisationId: org.id, role: 'OWNER' });

      const found = await memberRepo.findByUserAndOrg('u1', org.id);
      expect(found).not.toBeNull();
      expect(found!.role).toBe('OWNER');
    });

    it('returns null when not found', async () => {
      expect(await memberRepo.findByUserAndOrg('u1', 'org-99')).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns memberships with org data', async () => {
      const org1 = await orgRepo.create({ name: 'org-1', ownerId: 'u1' });
      const org2 = await orgRepo.create({ name: 'org-2', ownerId: 'u1' });
      await memberRepo.create({ userId: 'u1', organisationId: org1.id, role: 'OWNER' });
      await memberRepo.create({ userId: 'u1', organisationId: org2.id, role: 'MEMBER' });

      const results = await memberRepo.findByUserId('u1');
      expect(results).toHaveLength(2);
      expect(results[0].organisation).toBeDefined();
    });
  });

  describe('delete', () => {
    it('removes membership', async () => {
      const org = await orgRepo.create({ name: 'org', ownerId: 'u1' });
      await memberRepo.create({ userId: 'u1', organisationId: org.id, role: 'OWNER' });
      await memberRepo.delete('u1', org.id);

      expect(await memberRepo.findByUserAndOrg('u1', org.id)).toBeNull();
    });
  });
});
