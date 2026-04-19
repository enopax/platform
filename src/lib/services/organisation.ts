import { getStoreAsync } from '@/lib/store';
import type { Organisation, OrganisationRole } from '@/lib/store';
import type { CreateOrganisationData, OrganisationWithMemberCount } from '@/lib/store/repositories/organisation.repository';
import { validateNameFormat } from '../name-validation';
import { seedBuiltInRoles } from '../seed-roles';

export type { CreateOrganisationData };
export type OrganisationInfo = OrganisationWithMemberCount;

export class OrganisationService {
  async createOrganisation(ownerId: string, data: CreateOrganisationData): Promise<OrganisationInfo> {
    try {
      const store = await getStoreAsync();
      const organisation = await store.organisations.create({ ...data, ownerId });

      await store.organisationMembers.create({
        userId: ownerId,
        organisationId: organisation.id,
        role: 'OWNER',
      });

      await store.teams.create({
        organisationId: organisation.id,
        name: 'All Members',
        description: 'Default team — all organisation members',
        defaultProjectRole: 'DEVELOPER',
      });

      await seedBuiltInRoles(organisation.id);

      try {
        const orgSlug = organisation.slug || organisation.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        await store.namespaces.register({ slug: orgSlug, entityType: 'ORGANISATION', entityId: organisation.id });
      } catch {}

      return { ...organisation, memberCount: 1 };
    } catch (error) {
      console.error('Failed to create organisation:', error);
      throw error;
    }
  }

  async getOrganisationById(organisationId: string): Promise<OrganisationInfo | null> {
    try {
      const store = await getStoreAsync();
      return await store.organisations.findByIdWithMemberCount(organisationId);
    } catch (error) {
      console.error('Failed to get organisation:', error);
      throw error;
    }
  }

  async getOrganisationByName(name: string): Promise<OrganisationInfo | null> {
    try {
      const store = await getStoreAsync();
      return await store.organisations.findByNameWithMemberCount(name);
    } catch (error) {
      console.error('Failed to get organisation by name:', error);
      throw error;
    }
  }

  async getUserOrganisations(userId: string): Promise<OrganisationInfo[]> {
    try {
      const store = await getStoreAsync();
      const memberships = await store.organisationMembers.findByUserId(userId);
      const results: OrganisationInfo[] = [];
      for (const m of memberships) {
        const members = await store.organisationMembers.findByOrgId(m.organisationId);
        results.push({ ...m.organisation, memberCount: members.length });
      }
      return results;
    } catch (error) {
      console.error('Failed to get user organisations:', error);
      throw error;
    }
  }

  async updateOrganisation(
    organisationId: string,
    userId: string,
    data: Partial<CreateOrganisationData> & { visibility?: string }
  ): Promise<OrganisationInfo> {
    try {
      const store = await getStoreAsync();
      const membership = await store.organisationMembers.findByUserAndOrg(userId, organisationId);

      if (!membership || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new Error('Insufficient permissions to update organisation');
      }

      const organisation = await store.organisations.update(organisationId, data);
      return await store.organisations.findByIdWithMemberCount(organisationId) ?? { ...organisation, memberCount: 0 };
    } catch (error) {
      console.error('Failed to update organisation:', error);
      throw error;
    }
  }

  async deleteOrganisation(organisationId: string, userId: string): Promise<void> {
    try {
      const store = await getStoreAsync();
      const organisation = await store.organisations.findById(organisationId);

      if (!organisation || organisation.ownerId !== userId) {
        throw new Error('Only the organisation owner can delete the organisation');
      }

      await store.organisations.update(organisationId, { isActive: false });
    } catch (error) {
      console.error('Failed to delete organisation:', error);
      throw error;
    }
  }

  async getUserRole(userId: string, organisationId: string): Promise<OrganisationRole | null> {
    try {
      const store = await getStoreAsync();
      const membership = await store.organisationMembers.findByUserAndOrg(userId, organisationId);
      return membership?.role || null;
    } catch (error) {
      console.error('Failed to get user role:', error);
      throw error;
    }
  }

  async isUserMember(userId: string, organisationId: string): Promise<boolean> {
    try {
      const store = await getStoreAsync();
      const membership = await store.organisationMembers.findByUserAndOrg(userId, organisationId);
      return !!membership;
    } catch (error) {
      console.error('Failed to check membership:', error);
      return false;
    }
  }

  async validateOrganisationName(name: string, excludeId?: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const formatValidation = validateNameFormat(name);
      if (!formatValidation.isValid) {
        return formatValidation;
      }

      const store = await getStoreAsync();
      const existing = await store.organisations.findActiveByName(name, excludeId);

      if (existing) {
        return { isValid: false, error: 'Organisation name is already in use' };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Failed to validate organisation name:', error);
      return { isValid: false, error: 'Failed to validate organisation name' };
    }
  }

  async getOrganisationMembers(organisationId: string) {
    try {
      const store = await getStoreAsync();
      const members = await store.organisationMembers.findByOrgId(organisationId);
      return members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user,
      }));
    } catch (error) {
      console.error('Failed to get organisation members:', error);
      throw error;
    }
  }

  async searchOrganisations(query: string, limit: number = 10) {
    try {
      const store = await getStoreAsync();
      return await store.organisations.search(query, limit);
    } catch (error) {
      console.error('Failed to search organisations:', error);
      return [];
    }
  }
}

export const organisationService = new OrganisationService();
