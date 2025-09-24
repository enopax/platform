'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { JoinRequestStatus } from '@prisma/client';
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

    // Check if organisation exists and is active
    const organisation = await prisma.organisation.findUnique({
      where: { 
        id: organisationId,
        isActive: true 
      }
    });

    if (!organisation) {
      return { error: 'Organisation not found or inactive' };
    }

    // Check if user is already a member
    const existingMember = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId
        }
      }
    });

    if (existingMember) {
      return { error: 'You are already a member of this organisation' };
    }

    // Check if user is the owner
    if (organisation.ownerId === session.user.id) {
      return { error: 'You are the owner of this organisation' };
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.organisationJoinRequest.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId
        }
      }
    });

    console.log('Existing join request:', existingRequest);

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return { error: 'You already have a pending request for this organisation' };
      } else if (existingRequest.status === 'REJECTED') {
        // Allow user to re-request if previously rejected
        await prisma.organisationJoinRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: 'PENDING',
            requestedAt: new Date(),
            respondedAt: null,
            respondedBy: null,
          }
        });

        revalidatePath('/main/organisations');
        return { success: true };
      } else if (existingRequest.status === 'APPROVED') {
        // If user had approved request but left, allow them to create new request
        await prisma.organisationJoinRequest.delete({
          where: { id: existingRequest.id }
        });
        // Continue to create new request below
      }
    }

    // Create new join request
    await prisma.organisationJoinRequest.create({
      data: {
        userId: session.user.id,
        organisationId,
      }
    });

    revalidatePath('/main/organisations');
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

    // Get the join request with organisation details
    const joinRequest = await prisma.organisationJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        organisation: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstname: true,
            lastname: true,
          }
        }
      }
    });

    if (!joinRequest) {
      return { error: 'Join request not found' };
    }

    if (joinRequest.status !== 'PENDING') {
      return { error: 'This request has already been processed' };
    }

    // Check if current user is the organisation owner
    if (joinRequest.organisation.ownerId !== session.user.id) {
      return { error: 'You do not have permission to respond to this request' };
    }

    // Update the join request status
    await prisma.organisationJoinRequest.update({
      where: { id: requestId },
      data: {
        status,
        respondedBy: session.user.id,
        respondedAt: new Date(),
      }
    });

    // If approved, add user as organisation member
    if (status === 'APPROVED') {
      await prisma.organisationMember.create({
        data: {
          userId: joinRequest.userId,
          organisationId: joinRequest.organisationId,
          role: 'MEMBER',
        }
      });

      // Log the addition
      await logOrganisationMembershipChange(
        joinRequest.organisationId,
        joinRequest.userId,
        session.user.id,
        'ADDED',
        undefined,
        'MEMBER'
      );
    }

    revalidatePath('/main/organisations');
    revalidatePath(`/main/organisations/${joinRequest.organisationId}`);
    
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

    // Find and delete the pending join request
    const joinRequest = await prisma.organisationJoinRequest.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId
        }
      }
    });

    if (!joinRequest) {
      return { error: 'Join request not found' };
    }

    if (joinRequest.status !== 'PENDING') {
      return { error: 'Cannot cancel a processed request' };
    }

    await prisma.organisationJoinRequest.delete({
      where: { id: joinRequest.id }
    });

    revalidatePath('/main/organisations');
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

    // Check if user is the organisation owner
    const organisation = await prisma.organisation.findUnique({
      where: { id: organisationId }
    });

    if (!organisation || organisation.ownerId !== session.user.id) {
      return { error: 'You do not have permission to view join requests' };
    }

    const joinRequests = await prisma.organisationJoinRequest.findMany({
      where: {
        organisationId,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstname: true,
            lastname: true,
            image: true,
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    });

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

    const joinRequest = await prisma.organisationJoinRequest.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId
        }
      }
    });

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

    // Check if user is a member of the organisation
    const membership = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId
        }
      },
      include: {
        organisation: {
          select: {
            ownerId: true,
            name: true
          }
        }
      }
    });

    if (!membership) {
      return { error: 'You are not a member of this organisation' };
    }

    // Prevent owner from leaving their own organisation
    if (membership.organisation.ownerId === session.user.id) {
      return { error: 'Organisation owners cannot leave their organisation. Transfer ownership first.' };
    }

    // Check if user is a team lead in any teams within this organisation
    const teamLeaderships = await prisma.teamMember.findMany({
      where: {
        userId: session.user.id,
        role: 'LEAD',
        team: {
          organisationId
        }
      },
      include: {
        team: {
          select: {
            name: true
          }
        }
      }
    });

    if (teamLeaderships.length > 0) {
      const teamNames = teamLeaderships.map(tl => tl.team.name).join(', ');
      return { 
        error: `You are a team lead in: ${teamNames}. Please transfer leadership before leaving the organisation.` 
      };
    }

    // Remove user from all teams in this organisation
    await prisma.teamMember.deleteMany({
      where: {
        userId: session.user.id,
        team: {
          organisationId
        }
      }
    });

    // Remove organisation membership
    await prisma.organisationMember.delete({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId
        }
      }
    });

    // Log the removal
    await logOrganisationMembershipChange(
      organisationId,
      session.user.id,
      session.user.id, // User left themselves
      'REMOVED',
      membership.role,
      undefined,
      'User left the organisation'
    );

    // Also remove any pending join requests
    await prisma.organisationJoinRequest.deleteMany({
      where: {
        userId: session.user.id,
        organisationId
      }
    });

    revalidatePath('/main/organisations');
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

    // Check if current user has permission to kick (must be owner, manager, or admin)
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin) {
      const membership = await prisma.organisationMember.findUnique({
        where: {
          userId_organisationId: {
            userId: session.user.id,
            organisationId
          }
        },
        include: {
          organisation: {
            select: {
              ownerId: true
            }
          }
        }
      });

      if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
        return { error: 'You do not have permission to remove members' };
      }
    }

    // Check if target user is a member
    const targetMembership = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId: targetUserId,
          organisationId
        }
      },
      include: {
        organisation: {
          select: {
            ownerId: true,
            name: true
          }
        }
      }
    });

    if (!targetMembership) {
      return { error: 'User is not a member of this organisation' };
    }

    // Prevent kicking the organisation owner
    if (targetMembership.organisation.ownerId === targetUserId) {
      return { error: 'Cannot remove the organisation owner' };
    }

    // Prevent users from kicking themselves (they should use leave instead)
    if (targetUserId === session.user.id) {
      return { error: 'Use the leave organisation function instead' };
    }

    // Check if target user is a team lead in any teams within this organisation
    const teamLeaderships = await prisma.teamMember.findMany({
      where: {
        userId: targetUserId,
        role: 'LEAD',
        team: {
          organisationId
        }
      },
      include: {
        team: {
          select: {
            name: true
          }
        }
      }
    });

    if (teamLeaderships.length > 0) {
      const teamNames = teamLeaderships.map(tl => tl.team.name).join(', ');
      return { 
        error: `User is a team lead in: ${teamNames}. Please transfer leadership before removing.` 
      };
    }

    // Remove user from all teams in this organisation
    await prisma.teamMember.deleteMany({
      where: {
        userId: targetUserId,
        team: {
          organisationId
        }
      }
    });

    // Remove organisation membership
    await prisma.organisationMember.delete({
      where: {
        userId_organisationId: {
          userId: targetUserId,
          organisationId
        }
      }
    });

    // Log the removal
    await logOrganisationMembershipChange(
      organisationId,
      targetUserId,
      session.user.id,
      'REMOVED',
      targetMembership.role,
      undefined,
      'Member was kicked from the organisation'
    );

    // Also remove any pending join requests
    await prisma.organisationJoinRequest.deleteMany({
      where: {
        userId: targetUserId,
        organisationId
      }
    });

    revalidatePath('/main/organisations');
    revalidatePath(`/main/organisations/${organisationId}`);
    revalidatePath(`/main/organisations/${organisationId}/members`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to kick member:', error);
    return {
      error: 'Failed to remove member. Please try again.',
    };
  }
}