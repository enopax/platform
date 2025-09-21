import { PrismaClient, TeamRole } from '@prisma/client';
import { teamService } from './team';
import { userService } from './user';

const prisma = new PrismaClient();

export interface TeamMemberInfo {
  id: string;
  role: TeamRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export class TeamMemberService {
  async addTeamMember(
    teamId: string,
    userId: string,
    addedBy: string,
    role: TeamRole = TeamRole.MEMBER
  ): Promise<void> {
    try {
      // Validate inputs
      if (!teamId || !userId || !addedBy) {
        throw new Error('Team ID, user ID, and addedBy are required');
      }

      // Check if user exists and is active
      const userExists = await userService.validateUserExists(userId);
      if (!userExists) {
        throw new Error('User does not exist or is inactive');
      }

      // Use team service to add member (it handles all validations)
      await teamService.addTeamMember(teamId, userId, addedBy, role);
    } catch (error) {
      console.error('Failed to add team member:', error);
      throw error;
    }
  }

  async updateMemberRole(
    teamId: string,
    userId: string,
    newRole: TeamRole,
    updatedBy: string
  ): Promise<void> {
    try {
      // Check if the person updating has permission (team owner or lead)
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: updatedBy,
            teamId,
          },
        },
      });

      const team = await teamService.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      if (!membership || (!['LEAD'].includes(membership.role) && team.ownerId !== updatedBy)) {
        throw new Error('Insufficient permissions to update member role');
      }

      // Cannot change the team owner's role
      if (team.ownerId === userId) {
        throw new Error('Cannot change team owner role');
      }

      // Check if member exists
      const existingMembership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!existingMembership) {
        throw new Error('User is not a member of this team');
      }

      // Update the role
      await prisma.teamMember.update({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
        data: { role: newRole },
      });
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  }

  async removeMember(teamId: string, userId: string, removedBy: string): Promise<void> {
    try {
      // Use team service to remove member (it handles all validations)
      await teamService.removeTeamMember(teamId, userId, removedBy);
    } catch (error) {
      console.error('Failed to remove team member:', error);
      throw error;
    }
  }

  async promoteMember(teamId: string, userId: string, promotedBy: string): Promise<void> {
    try {
      // Get current role
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!membership) {
        throw new Error('User is not a member of this team');
      }

      // Only promote MEMBER to LEAD
      if (membership.role === TeamRole.MEMBER) {
        await this.updateMemberRole(teamId, userId, TeamRole.LEAD, promotedBy);
      } else {
        throw new Error('Can only promote members to lead role');
      }
    } catch (error) {
      console.error('Failed to promote member:', error);
      throw error;
    }
  }

  async demoteMember(teamId: string, userId: string, demotedBy: string): Promise<void> {
    try {
      // Get current role
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!membership) {
        throw new Error('User is not a member of this team');
      }

      // Only demote LEAD to MEMBER
      if (membership.role === TeamRole.LEAD) {
        await this.updateMemberRole(teamId, userId, TeamRole.MEMBER, demotedBy);
      } else {
        throw new Error('Can only demote leads to member role');
      }
    } catch (error) {
      console.error('Failed to demote member:', error);
      throw error;
    }
  }

  async getTeamMembers(teamId: string): Promise<TeamMemberInfo[]> {
    try {
      // Use team service to get members
      return await teamService.getTeamMembers(teamId);
    } catch (error) {
      console.error('Failed to get team members:', error);
      throw error;
    }
  }

  async getUserRole(userId: string, teamId: string): Promise<TeamRole | null> {
    try {
      return await teamService.getUserRole(userId, teamId);
    } catch (error) {
      console.error('Failed to get user role:', error);
      throw error;
    }
  }

  async isUserMember(userId: string, teamId: string): Promise<boolean> {
    try {
      return await teamService.isUserMember(userId, teamId);
    } catch (error) {
      console.error('Failed to check membership:', error);
      return false;
    }
  }
}

export const teamMemberService = new TeamMemberService();