import { getStoreAsync } from '@/lib/store';
import type { JoinRequestStatus } from '@/lib/store';
import { organisationService } from './organisation';
import { userService } from './user';
import { logOrganisationMembershipChange } from '@/lib/auditLog';

export interface OrganisationJoinRequestInfo {
  id: string;
  userId: string;
  organisationId: string;
  status: JoinRequestStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
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
      const userExists = await userService.validateUserExists(userId);
      if (!userExists) throw new Error('User not found or inactive');

      const organisation = await organisationService.getOrganisationById(organisationId);
      if (!organisation || !organisation.isActive) throw new Error('Organisation not found or inactive');

      const isMember = await organisationService.isUserMember(userId, organisationId);
      if (isMember) throw new Error('User is already a member of this organisation');

      const store = await getStoreAsync();
      const existingRequest = await store.joinRequests.findByUserAndOrg(userId, organisationId, 'PENDING');
      if (existingRequest) throw new Error('A join request is already pending for this organisation');

      const joinRequest = await store.joinRequests.create({ userId, organisationId, message: message?.trim() });

      const user = await userService.getUserById(userId);

      return {
        id: joinRequest.id,
        userId: joinRequest.userId,
        organisationId: joinRequest.organisationId,
        status: joinRequest.status,
        createdAt: joinRequest.requestedAt,
        updatedAt: joinRequest.updatedAt,
        user: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
          image: user!.image,
        },
        organisation: {
          id: organisation.id,
          name: organisation.name,
        },
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
      const store = await getStoreAsync();
      const joinRequest = await store.joinRequests.findById(joinRequestId);

      if (!joinRequest) throw new Error('Join request not found');
      if (joinRequest.status !== 'PENDING') throw new Error('Join request has already been processed');

      const responderRole = await organisationService.getUserRole(responderId, joinRequest.organisationId);
      if (!responderRole || !['OWNER', 'MANAGER'].includes(responderRole)) {
        throw new Error('Insufficient permissions to respond to join requests');
      }

      const newStatus: JoinRequestStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

      await store.joinRequests.update(joinRequestId, {
        status: newStatus,
        respondedBy: responderId,
        respondedAt: new Date(),
        responseMessage: responseMessage?.trim(),
      });

      if (action === 'approve') {
        await store.organisationMembers.create({
          userId: joinRequest.userId,
          organisationId: joinRequest.organisationId,
          role: 'MEMBER',
        });

        await logOrganisationMembershipChange(
          joinRequest.organisationId,
          joinRequest.userId,
          responderId,
          'ADDED',
          undefined,
          'MEMBER',
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
      const store = await getStoreAsync();
      const joinRequest = await store.joinRequests.findById(joinRequestId);

      if (!joinRequest) throw new Error('Join request not found');
      if (joinRequest.userId !== userId) throw new Error('You can only cancel your own join requests');
      if (joinRequest.status !== 'PENDING') throw new Error('Can only cancel pending join requests');

      await store.joinRequests.update(joinRequestId, { status: 'REJECTED' });
    } catch (error) {
      console.error('Failed to cancel join request:', error);
      throw error;
    }
  }

  async getOrganisationJoinRequests(organisationId: string): Promise<OrganisationJoinRequestInfo[]> {
    try {
      const store = await getStoreAsync();
      const requests = await store.joinRequests.findByOrgId(organisationId, 'PENDING');

      const organisation = await organisationService.getOrganisationById(organisationId);
      if (!organisation) return [];

      const results: OrganisationJoinRequestInfo[] = [];
      for (const req of requests) {
        const user = await userService.getUserById(req.userId);
        if (!user) continue;
        results.push({
          id: req.id,
          userId: req.userId,
          organisationId: req.organisationId,
          status: req.status,
          createdAt: req.requestedAt,
          updatedAt: req.updatedAt,
          user: { id: user.id, name: user.name, email: user.email, image: user.image },
          organisation: { id: organisation.id, name: organisation.name },
        });
      }

      return results;
    } catch (error) {
      console.error('Failed to get organisation join requests:', error);
      throw error;
    }
  }

  async getUserJoinRequestStatus(userId: string, organisationId: string): Promise<JoinRequestStatus | null> {
    try {
      const store = await getStoreAsync();
      const request = await store.joinRequests.findLatestByUserAndOrg(userId, organisationId);
      return request?.status || null;
    } catch (error) {
      console.error('Failed to get user join request status:', error);
      return null;
    }
  }

  async leaveOrganisation(userId: string, organisationId: string): Promise<void> {
    try {
      const store = await getStoreAsync();
      const membership = await store.organisationMembers.findByUserAndOrg(userId, organisationId);

      if (!membership) throw new Error('User is not a member of this organisation');

      const organisation = await organisationService.getOrganisationById(organisationId);
      if (organisation?.ownerId === userId) throw new Error('Organisation owner cannot leave the organisation');

      await store.organisationMembers.delete(userId, organisationId);

      await logOrganisationMembershipChange(
        organisationId, userId, userId,
        'REMOVED', membership.role, undefined, 'User left organisation'
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
      const kickerRole = await organisationService.getUserRole(kickedBy, organisationId);
      if (!kickerRole || !['OWNER', 'MANAGER'].includes(kickerRole)) {
        throw new Error('Insufficient permissions to kick members');
      }

      const store = await getStoreAsync();
      const membership = await store.organisationMembers.findByUserAndOrg(userId, organisationId);

      if (!membership) throw new Error('User is not a member of this organisation');

      const organisation = await organisationService.getOrganisationById(organisationId);
      if (organisation?.ownerId === userId) throw new Error('Cannot kick the organisation owner');
      if (membership.role === 'MANAGER' && kickerRole !== 'OWNER') {
        throw new Error('Only organisation owners can kick managers');
      }

      await store.organisationMembers.delete(userId, organisationId);

      await logOrganisationMembershipChange(
        organisationId, userId, kickedBy,
        'REMOVED', membership.role, undefined, reason || 'Member kicked from organisation'
      );
    } catch (error) {
      console.error('Failed to kick member:', error);
      throw error;
    }
  }
}

export const organisationJoinRequestService = new OrganisationJoinRequestService();
