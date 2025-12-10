import { PrismaClient, Organisation, OrganisationRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateOrganisationData {
  name: string;
  description?: string;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

export interface OrganisationInfo extends Organisation {
  memberCount: number;
  teamCount: number;
}

export class OrganisationService {
  async createOrganisation(ownerId: string, data: CreateOrganisationData): Promise<OrganisationInfo> {
    try {
      // Create the organisation
      const organisation = await prisma.organisation.create({
        data: {
          name: data.name,
          description: data.description,
          website: data.website,
          address: data.address,
          phone: data.phone,
          email: data.email,
          logo: data.logo,
          ownerId,
        },
      });

      // Automatically add the owner as a member with OWNER role
      await prisma.organisationMember.create({
        data: {
          userId: ownerId,
          organisationId: organisation.id,
          role: OrganisationRole.OWNER,
        },
      });

      // Return organisation with counts (all will be 0 for a new organisation)
      return {
        ...organisation,
        memberCount: 1, // Just the owner
        teamCount: 0,
      };
    } catch (error) {
      console.error('Failed to create organisation:', error);
      throw error;
    }
  }

  async getOrganisationById(organisationId: string): Promise<OrganisationInfo | null> {
    try {
      const organisation = await prisma.organisation.findUnique({
        where: { id: organisationId },
        include: {
          _count: {
            select: {
              members: true,
              teams: true,
            },
          },
        },
      });

      if (!organisation) {
        return null;
      }

      return {
        ...organisation,
        memberCount: organisation._count.members,
        teamCount: organisation._count.teams,
      };
    } catch (error) {
      console.error('Failed to get organisation:', error);
      throw error;
    }
  }

  async getOrganisationByName(name: string): Promise<OrganisationInfo | null> {
    try {
      const organisation = await prisma.organisation.findUnique({
        where: { name },
        include: {
          _count: {
            select: {
              members: true,
              teams: true,
            },
          },
        },
      });

      if (!organisation) {
        return null;
      }

      return {
        ...organisation,
        memberCount: organisation._count.members,
        teamCount: organisation._count.teams,
      };
    } catch (error) {
      console.error('Failed to get organisation by name:', error);
      throw error;
    }
  }

  async getUserOrganisations(userId: string): Promise<OrganisationInfo[]> {
    try {
      const memberships = await prisma.organisationMember.findMany({
        where: { userId },
        include: {
          organisation: {
            include: {
              _count: {
                select: {
                  members: true,
                  teams: true,
                  joinRequests: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });

      return memberships.map(membership => ({
        ...membership.organisation,
        memberCount: membership.organisation._count.members,
        teamCount: membership.organisation._count.teams,
      }));
    } catch (error) {
      console.error('Failed to get user organisations:', error);
      throw error;
    }
  }

  async updateOrganisation(
    organisationId: string,
    userId: string,
    data: Partial<CreateOrganisationData>
  ): Promise<OrganisationInfo> {
    try {
      // Check if user has permission to update (owner or manager)
      const membership = await prisma.organisationMember.findUnique({
        where: {
          userId_organisationId: {
            userId,
            organisationId,
          },
        },
      });

      if (!membership || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new Error('Insufficient permissions to update organisation');
      }

      // Update the organisation
      const organisation = await prisma.organisation.update({
        where: { id: organisationId },
        data: {
          name: data.name,
          description: data.description,
          website: data.website,
          address: data.address,
          phone: data.phone,
          email: data.email,
          logo: data.logo,
        },
        include: {
          _count: {
            select: {
              members: true,
              teams: true,
            },
          },
        },
      });

      return {
        ...organisation,
        memberCount: organisation._count.members,
        teamCount: organisation._count.teams,
      };
    } catch (error) {
      console.error('Failed to update organisation:', error);
      throw error;
    }
  }

  async deleteOrganisation(organisationId: string, userId: string): Promise<void> {
    try {
      // Check if user is the owner
      const organisation = await prisma.organisation.findUnique({
        where: { id: organisationId },
      });

      if (!organisation || organisation.ownerId !== userId) {
        throw new Error('Only the organisation owner can delete the organisation');
      }

      // Soft delete by setting isActive to false
      await prisma.organisation.update({
        where: { id: organisationId },
        data: { isActive: false },
      });
    } catch (error) {
      console.error('Failed to delete organisation:', error);
      throw error;
    }
  }

  async getUserRole(userId: string, organisationId: string): Promise<OrganisationRole | null> {
    try {
      const membership = await prisma.organisationMember.findUnique({
        where: {
          userId_organisationId: {
            userId,
            organisationId,
          },
        },
      });

      return membership?.role || null;
    } catch (error) {
      console.error('Failed to get user role:', error);
      throw error;
    }
  }

  async isUserMember(userId: string, organisationId: string): Promise<boolean> {
    try {
      const membership = await prisma.organisationMember.findUnique({
        where: {
          userId_organisationId: {
            userId,
            organisationId,
          },
        },
      });

      return !!membership;
    } catch (error) {
      console.error('Failed to check membership:', error);
      return false;
    }
  }

  async validateOrganisationName(name: string, excludeId?: string): Promise<boolean> {
    try {
      const existing = await prisma.organisation.findFirst({
        where: {
          name,
          isActive: true,
          ...(excludeId && { NOT: { id: excludeId } }),
        },
      });

      return !existing; // Return true if name is available
    } catch (error) {
      console.error('Failed to validate organisation name:', error);
      return false;
    }
  }

  async getOrganisationMembers(organisationId: string) {
    try {
      const members = await prisma.organisationMember.findMany({
        where: { organisationId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' }, // OWNER first, then MANAGER, then MEMBER
          { joinedAt: 'desc' },
        ],
      });

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
      const organisations = await prisma.organisation.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          website: true,
          email: true,
          isActive: true,
          owner: {
            select: {
              name: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
          _count: {
            select: {
              members: true,
              teams: true,
              joinRequests: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { name: 'asc' },
        ],
        take: limit,
        distinct: ['id'],
      });

      return organisations;
    } catch (error) {
      console.error('Failed to search organisations:', error);
      return [];
    }
  }

  async getAllOrganisations(): Promise<OrganisationInfo[]> {
    try {
      const organisations = await prisma.organisation.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              members: true,
              teams: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return organisations.map(org => ({
        ...org,
        memberCount: org._count.members,
        teamCount: org._count.teams,
      }));
    } catch (error) {
      console.error('Failed to get all organisations:', error);
      throw error;
    }
  }

  async findByOwner(ownerId: string): Promise<OrganisationInfo[]> {
    try {
      const organisations = await prisma.organisation.findMany({
        where: {
          ownerId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              members: true,
              teams: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return organisations.map(org => ({
        ...org,
        memberCount: org._count.members,
        teamCount: org._count.teams,
      }));
    } catch (error) {
      console.error('Failed to find organisations by owner:', error);
      throw error;
    }
  }
}

export const organisationService = new OrganisationService();