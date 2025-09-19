import { PrismaClient, Team, TeamRole, TeamVisibility } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTeamData {
  name: string;
  description?: string;
  color?: string;
  visibility?: TeamVisibility;
  allowJoinRequests?: boolean;
  maxMembers?: number;
  tags?: string[];
  organisationId: string;
}

export interface TeamInfo extends Team {
  memberCount: number;
  projectCount: number;
}

export class TeamService {
  async createTeam(ownerId: string, data: CreateTeamData): Promise<TeamInfo> {
    try {
      // Verify user is a member of the organisation
      const orgMembership = await prisma.organisationMember.findUnique({
        where: {
          userId_organisationId: {
            userId: ownerId,
            organisationId: data.organisationId,
          },
        },
      });

      if (!orgMembership) {
        throw new Error('User must be a member of the organisation to create teams');
      }

      // Create the team
      const team = await prisma.team.create({
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          visibility: data.visibility || TeamVisibility.PRIVATE,
          allowJoinRequests: data.allowJoinRequests ?? true,
          maxMembers: data.maxMembers,
          tags: data.tags || [],
          organisationId: data.organisationId,
          ownerId,
        },
      });

      // Automatically add the owner as a member with LEAD role
      await prisma.teamMember.create({
        data: {
          userId: ownerId,
          teamId: team.id,
          role: TeamRole.LEAD,
        },
      });

      // Return team with counts (all will be 0 for a new team except memberCount)
      return {
        ...team,
        memberCount: 1, // Just the owner
        projectCount: 0,
      };
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  }

  async getTeamById(teamId: string): Promise<TeamInfo | null> {
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      });

      if (!team) {
        return null;
      }

      return {
        ...team,
        memberCount: team._count.members,
        projectCount: team._count.projects,
      };
    } catch (error) {
      console.error('Failed to get team:', error);
      throw error;
    }
  }

  async getUserTeams(userId: string): Promise<TeamInfo[]> {
    try {
      const memberships = await prisma.teamMember.findMany({
        where: { userId },
        include: {
          team: {
            include: {
              _count: {
                select: {
                  members: true,
                  projects: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });

      return memberships.map(membership => ({
        ...membership.team,
        memberCount: membership.team._count.members,
        projectCount: membership.team._count.projects,
      }));
    } catch (error) {
      console.error('Failed to get user teams:', error);
      throw error;
    }
  }

  async getOrganisationTeams(organisationId: string, userId: string): Promise<TeamInfo[]> {
    try {
      // Verify user is a member of the organisation
      const orgMembership = await prisma.organisationMember.findUnique({
        where: {
          userId_organisationId: {
            userId,
            organisationId,
          },
        },
      });

      if (!orgMembership) {
        throw new Error('User must be a member of the organisation to view teams');
      }

      const teams = await prisma.team.findMany({
        where: {
          organisationId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return teams.map(team => ({
        ...team,
        memberCount: team._count.members,
        projectCount: team._count.projects,
      }));
    } catch (error) {
      console.error('Failed to get organisation teams:', error);
      throw error;
    }
  }

  async updateTeam(
    teamId: string,
    userId: string,
    data: Partial<CreateTeamData>
  ): Promise<TeamInfo> {
    try {
      // Check if user has permission to update (owner or lead)
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new Error('Team not found');
      }

      if (!membership || (!['LEAD'].includes(membership.role) && team.ownerId !== userId)) {
        throw new Error('Insufficient permissions to update team');
      }

      // Update the team
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          visibility: data.visibility,
          allowJoinRequests: data.allowJoinRequests,
          maxMembers: data.maxMembers,
          tags: data.tags,
        },
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      });

      return {
        ...updatedTeam,
        memberCount: updatedTeam._count.members,
        projectCount: updatedTeam._count.projects,
      };
    } catch (error) {
      console.error('Failed to update team:', error);
      throw error;
    }
  }

  async deleteTeam(teamId: string, userId: string): Promise<void> {
    try {
      // Check if user is the owner
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team || team.ownerId !== userId) {
        throw new Error('Only the team owner can delete the team');
      }

      // Soft delete by setting isActive to false
      await prisma.team.update({
        where: { id: teamId },
        data: { isActive: false },
      });
    } catch (error) {
      console.error('Failed to delete team:', error);
      throw error;
    }
  }

  async getUserRole(userId: string, teamId: string): Promise<TeamRole | null> {
    try {
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      return membership?.role || null;
    } catch (error) {
      console.error('Failed to get user role:', error);
      throw error;
    }
  }

  async isUserMember(userId: string, teamId: string): Promise<boolean> {
    try {
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      return !!membership;
    } catch (error) {
      console.error('Failed to check membership:', error);
      return false;
    }
  }

  async validateTeamName(name: string, organisationId: string, excludeId?: string): Promise<boolean> {
    try {
      const existing = await prisma.team.findFirst({
        where: {
          name,
          organisationId,
          isActive: true,
          ...(excludeId && { NOT: { id: excludeId } }),
        },
      });

      return !existing; // Return true if name is available
    } catch (error) {
      console.error('Failed to validate team name:', error);
      return false;
    }
  }

  async getTeamMembers(teamId: string) {
    try {
      const members = await prisma.teamMember.findMany({
        where: { teamId },
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
          { role: 'asc' }, // LEAD first, then MEMBER
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
      console.error('Failed to get team members:', error);
      throw error;
    }
  }

  async addTeamMember(teamId: string, userId: string, addedBy: string, role: TeamRole = TeamRole.MEMBER): Promise<void> {
    try {
      // Check if the person adding has permission (team owner or lead)
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: addedBy,
            teamId,
          },
        },
      });

      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new Error('Team not found');
      }

      if (!membership || (!['LEAD'].includes(membership.role) && team.ownerId !== addedBy)) {
        throw new Error('Insufficient permissions to add team members');
      }

      // Check if user is already a member
      const existingMembership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (existingMembership) {
        throw new Error('User is already a member of this team');
      }

      // Check team member limit
      if (team.maxMembers) {
        const currentMemberCount = await prisma.teamMember.count({
          where: { teamId },
        });

        if (currentMemberCount >= team.maxMembers) {
          throw new Error('Team has reached maximum member limit');
        }
      }

      // Add the member
      await prisma.teamMember.create({
        data: {
          userId,
          teamId,
          role,
        },
      });
    } catch (error) {
      console.error('Failed to add team member:', error);
      throw error;
    }
  }

  async removeTeamMember(teamId: string, userId: string, removedBy: string): Promise<void> {
    try {
      // Check if the person removing has permission (team owner or lead)
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: removedBy,
            teamId,
          },
        },
      });

      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new Error('Team not found');
      }

      // Team owner can remove anyone, leads can remove members but not other leads
      const canRemove = team.ownerId === removedBy ||
        (membership?.role === TeamRole.LEAD && removedBy !== userId);

      if (!canRemove) {
        throw new Error('Insufficient permissions to remove team member');
      }

      // Cannot remove the team owner
      if (team.ownerId === userId) {
        throw new Error('Cannot remove team owner from team');
      }

      // Remove the member
      await prisma.teamMember.delete({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });
    } catch (error) {
      console.error('Failed to remove team member:', error);
      throw error;
    }
  }
}

export const teamService = new TeamService();