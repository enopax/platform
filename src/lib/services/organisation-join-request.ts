import { PrismaClient, OrganisationJoinRequestStatus, OrganisationRole } from '@prisma/client';
import { organisationService } from './organisation';
import { userService } from './user';
import { logOrganisationMembershipChange } from '@/lib/auditLog';

const prisma = new PrismaClient();

export interface OrganisationJoinRequestInfo {
  id: string;
  userId: string;
  organisationId: string;
  status: OrganisationJoinRequestStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  organisation: {
    id: string;
    name: string;
  };
}

export class OrganisationJoinRequestService {
  async createJoinRequest(
    userId: string,
    organisationId: string,
    message?: string
  ): Promise<OrganisationJoinRequestInfo> {
    try {
      // Validate user exists
      const userExists = await userService.validateUserExists(userId);
      if (!userExists) {
        throw new Error('User not found or inactive');
      }

      // Validate organisation exists
      const organisation = await organisationService.getOrganisationById(organisationId);
      if (!organisation || !organisation.isActive) {
        throw new Error('Organisation not found or inactive');
      }

      // Check if user is already a member
      const isMember = await organisationService.isUserMember(userId, organisationId);
      if (isMember) {
        throw new Error('User is already a member of this organisation');
      }

      // Check if there's already a pending request
      const existingRequest = await prisma.organisationJoinRequest.findFirst({
        where: {
          userId,
          organisationId,
          status: OrganisationJoinRequestStatus.PENDING,
        },
      });

      if (existingRequest) {
        throw new Error('A join request is already pending for this organisation');
      }

      // Create the join request
      const joinRequest = await prisma.organisationJoinRequest.create({
        data: {
          userId,
          organisationId,
          message: message?.trim() || null,
          status: OrganisationJoinRequestStatus.PENDING,
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
          organisation: {
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
        organisationId: joinRequest.organisationId,
        status: joinRequest.status,
        message: joinRequest.message,
        createdAt: joinRequest.createdAt,
        updatedAt: joinRequest.updatedAt,
        user: joinRequest.user,
        organisation: joinRequest.organisation,
      };
    } catch (error) {
      console.error('Failed to create join request:', error);
      throw error;
    }
  }

  async respondToJoinRequest(
    joinRequestId: string,
    responderId: string,
    action: 'approve' | 'reject',
    responseMessage?: string
  ): Promise<void> {
    try {
      // Get the join request
      const joinRequest = await prisma.organisationJoinRequest.findUnique({
        where: { id: joinRequestId },
        include: {
          organisation: true,
        },
      });

      if (!joinRequest) {
        throw new Error('Join request not found');
      }

      if (joinRequest.status !== OrganisationJoinRequestStatus.PENDING) {
        throw new Error('Join request has already been processed');
      }

      // Check if responder has permission (owner or manager)
      const responderRole = await organisationService.getUserRole(responderId, joinRequest.organisationId);
      if (!responderRole || !['OWNER', 'MANAGER'].includes(responderRole)) {
        throw new Error('Insufficient permissions to respond to join requests');
      }

      const newStatus = action === 'approve'
        ? OrganisationJoinRequestStatus.APPROVED
        : OrganisationJoinRequestStatus.REJECTED;

      // Update the join request
      await prisma.organisationJoinRequest.update({
        where: { id: joinRequestId },
        data: {
          status: newStatus,
          responseMessage: responseMessage?.trim() || null,
          respondedAt: new Date(),
          responderId,
        },
      });

      // If approved, add user to organisation as member
      if (action === 'approve') {
        await prisma.organisationMember.create({
          data: {
            userId: joinRequest.userId,
            organisationId: joinRequest.organisationId,
            role: OrganisationRole.MEMBER,
          },
        });

        // Log the membership change
        await logOrganisationMembershipChange(
          joinRequest.organisationId,
          joinRequest.userId,
          responderId,
          'ADDED',
          undefined,
          OrganisationRole.MEMBER,
          'Join request approved'
        );
      }
    } catch (error) {
      console.error('Failed to respond to join request:', error);
      throw error;
    }
  }

  async cancelJoinRequest(joinRequestId: string, userId: string): Promise<void> {
    try {
      // Get the join request
      const joinRequest = await prisma.organisationJoinRequest.findUnique({
        where: { id: joinRequestId },
      });

      if (!joinRequest) {
        throw new Error('Join request not found');
      }

      // Check if user is the one who made the request
      if (joinRequest.userId !== userId) {
        throw new Error('You can only cancel your own join requests');
      }

      if (joinRequest.status !== OrganisationJoinRequestStatus.PENDING) {
        throw new Error('Can only cancel pending join requests');
      }

      // Update the join request status
      await prisma.organisationJoinRequest.update({
        where: { id: joinRequestId },
        data: {
          status: OrganisationJoinRequestStatus.CANCELLED,
        },
      });
    } catch (error) {
      console.error('Failed to cancel join request:', error);
      throw error;
    }
  }

  async getOrganisationJoinRequests(organisationId: string): Promise<OrganisationJoinRequestInfo[]> {
    try {
      const joinRequests = await prisma.organisationJoinRequest.findMany({
        where: {
          organisationId,
          status: OrganisationJoinRequestStatus.PENDING,
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
          organisation: {
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
        organisationId: request.organisationId,
        status: request.status,
        message: request.message,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        user: request.user,
        organisation: request.organisation,
      }));
    } catch (error) {
      console.error('Failed to get organisation join requests:', error);
      throw error;
    }
  }

  async getUserJoinRequestStatus(userId: string, organisationId: string): Promise<OrganisationJoinRequestStatus | null> {
    try {
      const joinRequest = await prisma.organisationJoinRequest.findFirst({
        where: {
          userId,
          organisationId,
        },
        orderBy: { createdAt: 'desc' },
      });

      return joinRequest?.status || null;
    } catch (error) {
      console.error('Failed to get user join request status:', error);
      return null;
    }
  }

  async leaveOrganisation(userId: string, organisationId: string): Promise<void> {
    try {
      // Check if user is a member
      const membership = await prisma.organisationMember.findUnique({
        where: {
          userId_organisationId: {
            userId,
            organisationId,
          },
        },
      });

      if (!membership) {
        throw new Error('User is not a member of this organisation');
      }

      // Check if user is the owner
      const organisation = await organisationService.getOrganisationById(organisationId);
      if (organisation?.ownerId === userId) {
        throw new Error('Organisation owner cannot leave the organisation');
      }

      // Remove membership
      await prisma.organisationMember.delete({
        where: {
          userId_organisationId: {
            userId,
            organisationId,
          },
        },
      });

      // Log the membership change
      await logOrganisationMembershipChange(
        organisationId,
        userId,
        userId, // User removed themselves
        'REMOVED',
        membership.role,
        undefined,
        'User left organisation'
      );
    } catch (error) {
      console.error('Failed to leave organisation:', error);
      throw error;
    }
  }

  async kickMember(
    organisationId: string,
    userId: string,
    kickedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      // Check if kicker has permission (owner or manager)
      const kickerRole = await organisationService.getUserRole(kickedBy, organisationId);
      if (!kickerRole || !['OWNER', 'MANAGER'].includes(kickerRole)) {
        throw new Error('Insufficient permissions to kick members');
      }

      // Get member info
      const membership = await prisma.organisationMember.findUnique({
        where: {
          userId_organisationId: {
            userId,
            organisationId,
          },
        },
      });

      if (!membership) {
        throw new Error('User is not a member of this organisation');
      }

      // Check if trying to kick the owner
      const organisation = await organisationService.getOrganisationById(organisationId);
      if (organisation?.ownerId === userId) {
        throw new Error('Cannot kick the organisation owner');
      }

      // Managers cannot kick other managers or owners, only owners can kick managers
      if (membership.role === OrganisationRole.MANAGER && kickerRole !== OrganisationRole.OWNER) {
        throw new Error('Only organisation owners can kick managers');
      }

      // Remove membership
      await prisma.organisationMember.delete({
        where: {
          userId_organisationId: {
            userId,
            organisationId,
          },
        },
      });

      // Log the membership change
      await logOrganisationMembershipChange(
        organisationId,
        userId,
        kickedBy,
        'REMOVED',
        membership.role,
        undefined,
        reason || 'Member kicked from organisation'
      );
    } catch (error) {
      console.error('Failed to kick member:', error);
      throw error;
    }
  }
}

export const organisationJoinRequestService = new OrganisationJoinRequestService();