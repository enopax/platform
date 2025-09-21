import { PrismaClient, TeamJoinRequestStatus, TeamRole } from '@prisma/client';
import { teamService } from './team';
import { userService } from './user';

const prisma = new PrismaClient();

export interface TeamJoinRequestInfo {
  id: string;
  userId: string;
  teamId: string;
  status: TeamJoinRequestStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  team: {
    id: string;
    name: string;
  };
}

export class TeamJoinRequestService {
  async createTeamJoinRequest(
    userId: string,
    teamId: string,
    message?: string
  ): Promise<TeamJoinRequestInfo> {
    try {
      // Validate user exists
      const userExists = await userService.validateUserExists(userId);
      if (!userExists) {
        throw new Error('User not found or inactive');
      }

      // Validate team exists
      const team = await teamService.getTeamById(teamId);
      if (!team || !team.isActive) {
        throw new Error('Team not found or inactive');
      }

      // Check if team allows join requests
      if (!team.allowJoinRequests) {
        throw new Error('This team does not allow join requests');
      }

      // Check if user is already a member
      const isMember = await teamService.isUserMember(userId, teamId);
      if (isMember) {
        throw new Error('User is already a member of this team');
      }

      // Check if there's already a pending request
      const existingRequest = await prisma.teamJoinRequest.findFirst({
        where: {
          userId,
          teamId,
          status: TeamJoinRequestStatus.PENDING,
        },
      });

      if (existingRequest) {
        throw new Error('A join request is already pending for this team');
      }

      // Check team member limit
      if (team.maxMembers) {
        const currentMemberCount = team.memberCount;
        if (currentMemberCount >= team.maxMembers) {
          throw new Error('Team has reached maximum member limit');
        }
      }

      // Create the join request
      const joinRequest = await prisma.teamJoinRequest.create({
        data: {
          userId,
          teamId,
          message: message?.trim() || null,
          status: TeamJoinRequestStatus.PENDING,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        id: joinRequest.id,
        userId: joinRequest.userId,
        teamId: joinRequest.teamId,
        status: joinRequest.status,
        message: joinRequest.message,
        createdAt: joinRequest.createdAt,
        updatedAt: joinRequest.updatedAt,
        user: joinRequest.user,
        team: joinRequest.team,
      };
    } catch (error) {
      console.error('Failed to create team join request:', error);
      throw error;
    }
  }

  async respondToTeamJoinRequest(
    joinRequestId: string,
    responderId: string,
    action: 'approve' | 'reject',
    responseMessage?: string
  ): Promise<void> {
    try {
      // Get the join request
      const joinRequest = await prisma.teamJoinRequest.findUnique({
        where: { id: joinRequestId },
        include: {
          team: true,
        },
      });

      if (!joinRequest) {
        throw new Error('Join request not found');
      }

      if (joinRequest.status !== TeamJoinRequestStatus.PENDING) {
        throw new Error('Join request has already been processed');
      }

      // Check if responder has permission (team owner or lead)
      const responderRole = await teamService.getUserRole(responderId, joinRequest.teamId);
      const team = await teamService.getTeamById(joinRequest.teamId);

      if (!team) {
        throw new Error('Team not found');
      }

      if (!responderRole || (!['LEAD'].includes(responderRole) && team.ownerId !== responderId)) {
        throw new Error('Insufficient permissions to respond to join requests');
      }

      const newStatus = action === 'approve'
        ? TeamJoinRequestStatus.APPROVED
        : TeamJoinRequestStatus.REJECTED;

      // Update the join request
      await prisma.teamJoinRequest.update({
        where: { id: joinRequestId },
        data: {
          status: newStatus,
          responseMessage: responseMessage?.trim() || null,
          respondedAt: new Date(),
          responderId,
        },
      });

      // If approved, add user to team as member
      if (action === 'approve') {
        await teamService.addTeamMember(joinRequest.teamId, joinRequest.userId, responderId, TeamRole.MEMBER);
      }
    } catch (error) {
      console.error('Failed to respond to team join request:', error);
      throw error;
    }
  }

  async cancelTeamJoinRequest(joinRequestId: string, userId: string): Promise<void> {
    try {
      // Get the join request
      const joinRequest = await prisma.teamJoinRequest.findUnique({
        where: { id: joinRequestId },
      });

      if (!joinRequest) {
        throw new Error('Join request not found');
      }

      // Check if user is the one who made the request
      if (joinRequest.userId !== userId) {
        throw new Error('You can only cancel your own join requests');
      }

      if (joinRequest.status !== TeamJoinRequestStatus.PENDING) {
        throw new Error('Can only cancel pending join requests');
      }

      // Update the join request status
      await prisma.teamJoinRequest.update({
        where: { id: joinRequestId },
        data: {
          status: TeamJoinRequestStatus.CANCELLED,
        },
      });
    } catch (error) {
      console.error('Failed to cancel team join request:', error);
      throw error;
    }
  }

  async getTeamJoinRequests(teamId: string): Promise<TeamJoinRequestInfo[]> {
    try {
      const joinRequests = await prisma.teamJoinRequest.findMany({
        where: {
          teamId,
          status: TeamJoinRequestStatus.PENDING,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return joinRequests.map(request => ({
        id: request.id,
        userId: request.userId,
        teamId: request.teamId,
        status: request.status,
        message: request.message,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        user: request.user,
        team: request.team,
      }));
    } catch (error) {
      console.error('Failed to get team join requests:', error);
      throw error;
    }
  }

  async getUserTeamJoinRequestStatus(userId: string, teamId: string): Promise<TeamJoinRequestStatus | null> {
    try {
      const joinRequest = await prisma.teamJoinRequest.findFirst({
        where: {
          userId,
          teamId,
        },
        orderBy: { createdAt: 'desc' },
      });

      return joinRequest?.status || null;
    } catch (error) {
      console.error('Failed to get user team join request status:', error);
      return null;
    }
  }
}

export const teamJoinRequestService = new TeamJoinRequestService();