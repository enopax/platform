'use server';

import { getStoreAsync } from '@/lib/store';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { logOrganisationMembershipChange } from '@/lib/auditLog';

export interface CreateJoinRequestState {
  success?: boolean;
  error?: string;
}

export interface RespondToJoinRequestState {
  success?: boolean;
  error?: string;
}

export async function createJoinRequest(
  organisationId: string,
  prevState: CreateJoinRequestState,
  formData: FormData
): Promise<CreateJoinRequestState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    const store = await getStoreAsync();
    const organisation = await store.organisations.findById(organisationId);

    if (!organisation || !organisation.isActive) {
      return { error: 'Organisation not found or inactive' };
    }

    const existingMember = await store.organisationMembers.findByUserAndOrg(session.user.id, organisationId);

    if (existingMember) {
      return { error: 'You are already a member of this organisation' };
    }

    // Check if user is the owner
    if (organisation.ownerId === session.user.id) {
      return { error: 'You are the owner of this organisation' };
    }

    // Check if there's already a pending request
    const existingRequest = await store.joinRequests.findByUserAndOrg(session.user.id, organisationId);

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return { error: 'You already have a pending request for this organisation' };
      } else if (existingRequest.status === 'REJECTED') {
        // Allow user to re-request if previously rejected
        await store.joinRequests.update(existingRequest.id, {
          status: 'PENDING',
          respondedAt: undefined,
          respondedBy: undefined,
        });

        revalidatePath('/orga');
        return { success: true };
      } else if (existingRequest.status === 'APPROVED') {
        // If user had approved request but left, update to rejected so we can create fresh
        await store.joinRequests.update(existingRequest.id, {
          status: 'REJECTED',
        });
        // Continue to create new request below
      }
    }

    // Create new join request
    await store.joinRequests.create({
      userId: session.user.id,
      organisationId,
    });

    revalidatePath('/orga');
    return { success: true };
  } catch (error) {
    console.error('Failed to create join request:', error);
    return {
      error: 'Failed to create join request. Please try again.',
    };
  }
}

export async function respondToJoinRequest(
  requestId: string,
  status: 'APPROVED' | 'REJECTED'
): Promise<RespondToJoinRequestState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    const store = await getStoreAsync();

    // Get the join request and organisation details
    const joinRequest = await store.joinRequests.findById(requestId);

    if (!joinRequest) {
      return { error: 'Join request not found' };
    }

    if (joinRequest.status !== 'PENDING') {
      return { error: 'This request has already been processed' };
    }

    const organisation = await store.organisations.findById(joinRequest.organisationId);

    // Check if current user is the organisation owner
    if (!organisation || organisation.ownerId !== session.user.id) {
      return { error: 'You do not have permission to respond to this request' };
    }

    // Update the join request status
    await store.joinRequests.update(requestId, {
      status,
      respondedBy: session.user.id,
      respondedAt: new Date(),
    });

    if (status === 'APPROVED') {
      await store.organisationMembers.create({
        userId: joinRequest.userId,
        organisationId: joinRequest.organisationId,
        role: 'MEMBER',
      });

      await logOrganisationMembershipChange(
        joinRequest.organisationId,
        joinRequest.userId,
        session.user.id,
        'ADDED',
        undefined,
        'MEMBER'
      );
    }

    revalidatePath('/orga');
    revalidatePath(`/orga/${joinRequest.organisationId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to respond to join request:', error);
    return {
      error: 'Failed to respond to join request. Please try again.',
    };
  }
}

export async function cancelJoinRequest(
  organisationId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    // Find the pending join request
    const store = await getStoreAsync();
    const joinRequest = await store.joinRequests.findByUserAndOrg(session.user.id, organisationId);

    if (!joinRequest) {
      return { error: 'Join request not found' };
    }

    if (joinRequest.status !== 'PENDING') {
      return { error: 'Cannot cancel a processed request' };
    }

    // Mark as rejected instead of deleting (no delete in store)
    await store.joinRequests.update(joinRequest.id, {
      status: 'REJECTED',
    });

    revalidatePath('/orga');
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel join request:', error);
    return {
      error: 'Failed to cancel join request. Please try again.',
    };
  }
}

export async function getOrganisationJoinRequests(organisationId: string) {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    const store = await getStoreAsync();
    const organisation = await store.organisations.findById(organisationId);

    if (!organisation || organisation.ownerId !== session.user.id) {
      return { error: 'You do not have permission to view join requests' };
    }

    const rawRequests = await store.joinRequests.findByOrgId(organisationId, 'PENDING');

    const joinRequests = await Promise.all(
      rawRequests.map(async (req) => {
        const user = await store.users.findById(req.userId);
        return {
          ...req,
          user: {
            id: req.userId,
            email: user?.email ?? '',
            name: user?.name ?? null,
            firstname: user?.firstname ?? null,
            lastname: user?.lastname ?? null,
            image: user?.image ?? null,
          },
        };
      })
    );

    joinRequests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

    return { joinRequests };
  } catch (error) {
    console.error('Failed to get join requests:', error);
    return { error: 'Failed to load join requests' };
  }
}

export async function getUserJoinRequestStatus(organisationId: string) {
  try {
    const session = await auth();
    if (!session) {
      return null;
    }

    const store = await getStoreAsync();
    const joinRequest = await store.joinRequests.findLatestByUserAndOrg(session.user.id, organisationId);

    return joinRequest;
  } catch (error) {
    console.error('Failed to get join request status:', error);
    return null;
  }
}

export async function leaveOrganisation(organisationId: string) {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    const store = await getStoreAsync();
    const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisationId);

    if (!membership) {
      return { error: 'You are not a member of this organisation' };
    }

    const organisation = await store.organisations.findById(organisationId);

    if (organisation?.ownerId === session.user.id) {
      return { error: 'Organisation owners cannot leave their organisation. Transfer ownership first.' };
    }

    await store.organisationMembers.delete(session.user.id, organisationId);

    await logOrganisationMembershipChange(
      organisationId,
      session.user.id,
      session.user.id,
      'REMOVED',
      membership.role,
      undefined,
      'User left the organisation'
    );

    revalidatePath('/orga');
    return { success: true };
  } catch (error) {
    console.error('Failed to leave organisation:', error);
    return {
      error: 'Failed to leave organisation. Please try again.',
    };
  }
}

export async function kickMember(
  organisationId: string, 
  targetUserId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    const isAdmin = session.user.role === 'ADMIN';
    const store = await getStoreAsync();

    if (!isAdmin) {
      const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisationId);

      if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
        return { error: 'You do not have permission to remove members' };
      }
    }

    const targetMembership = await store.organisationMembers.findByUserAndOrg(targetUserId, organisationId);

    if (!targetMembership) {
      return { error: 'User is not a member of this organisation' };
    }

    const targetOrg = await store.organisations.findById(organisationId);

    if (targetOrg?.ownerId === targetUserId) {
      return { error: 'Cannot remove the organisation owner' };
    }

    // Prevent users from kicking themselves (they should use leave instead)
    if (targetUserId === session.user.id) {
      return { error: 'Use the leave organisation function instead' };
    }

    await store.organisationMembers.delete(targetUserId, organisationId);

    await logOrganisationMembershipChange(
      organisationId,
      targetUserId,
      session.user.id,
      'REMOVED',
      targetMembership.role,
      undefined,
      'Member was kicked from the organisation'
    );

    revalidatePath('/orga');
    revalidatePath(`/orga/${organisationId}`);
    revalidatePath(`/orga/${organisationId}/members`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to kick member:', error);
    return {
      error: 'Failed to remove member. Please try again.',
    };
  }
}