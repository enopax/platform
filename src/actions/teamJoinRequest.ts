'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { JoinRequestStatus } from '@prisma/client';
import { logTeamMembershipChange } from '@/lib/auditLog';

export interface CreateTeamJoinRequestState {
  success?: boolean;
  error?: string;
}

export interface RespondToTeamJoinRequestState {
  success?: boolean;
  error?: string;
}

/**
 * Create a team join request
 */
export async function createTeamJoinRequest(
  teamId: string,
  message?: string
): Promise<CreateTeamJoinRequestState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    // Check if team exists and allows join requests
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        organisation: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    if (!team.isActive) {
      return { error: 'This team is not active' };
    }

    if (!team.allowJoinRequests) {
      return { error: 'This team does not accept join requests' };
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId
        }
      }
    });

    if (existingMember) {
      return { error: 'You are already a member of this team' };
    }

    // Check if user is the team owner
    if (team.ownerId === session.user.id) {
      return { error: 'You are the owner of this team' };
    }

    // Check if user is a member of the organisation
    const orgMembership = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId: team.organisationId
        }
      }
    });

    if (!orgMembership) {
      return { error: 'You must be a member of the organisation to join this team' };
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.teamJoinRequest.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId
        }
      }
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return { error: 'You already have a pending request for this team' };
      } else if (existingRequest.status === 'REJECTED') {
        // Allow user to re-request if previously rejected
        await prisma.teamJoinRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: 'PENDING',
            message,
            requestedAt: new Date(),
            respondedAt: null,
            respondedBy: null,
          }
        });

        revalidatePath(`/main/teams/${teamId}`);
        revalidatePath('/main/teams');
        return { success: true };
      }
    }

    // Check team member limit
    if (team.maxMembers) {
      const memberCount = await prisma.teamMember.count({
        where: { teamId }
      });
      
      if (memberCount >= team.maxMembers) {
        return { error: 'This team has reached its maximum number of members' };
      }
    }

    // Create new join request
    await prisma.teamJoinRequest.create({
      data: {
        userId: session.user.id,
        teamId,
        message
      }
    });

    revalidatePath(`/main/teams/${teamId}`);
    revalidatePath('/main/teams');
    return { success: true };
  } catch (error) {
    console.error('Failed to create team join request:', error);
    return {
      error: 'Failed to create join request. Please try again.',
    };
  }
}

/**
 * Respond to a team join request (approve/reject)
 */
export async function respondToTeamJoinRequest(
  requestId: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
): Promise<RespondToTeamJoinRequestState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    // Get the join request with team details
    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        team: {
          include: {
            organisation: true
          }
        },
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

    // Check if current user has permission to respond
    const isAdmin = session.user.role === 'ADMIN';
    const isTeamOwner = joinRequest.team.ownerId === session.user.id;
    
    // Check if user is a team lead
    const teamMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: joinRequest.teamId
        }
      }
    });
    const isTeamLead = teamMembership?.role === 'LEAD';

    if (!isAdmin && !isTeamOwner && !isTeamLead) {
      return { error: 'You do not have permission to respond to this request' };
    }

    // Check team member limit if approving
    if (status === 'APPROVED' && joinRequest.team.maxMembers) {
      const memberCount = await prisma.teamMember.count({
        where: { teamId: joinRequest.teamId }
      });
      
      if (memberCount >= joinRequest.team.maxMembers) {
        return { error: 'Team has reached its maximum number of members' };
      }
    }

    // Update the join request status
    await prisma.teamJoinRequest.update({
      where: { id: requestId },
      data: {
        status,
        respondedBy: session.user.id,
        respondedAt: new Date(),
      }
    });

    // If approved, add user as team member
    if (status === 'APPROVED') {
      await prisma.teamMember.create({
        data: {
          userId: joinRequest.userId,
          teamId: joinRequest.teamId,
          role: 'MEMBER',
        }
      });

      // Log the addition
      await logTeamMembershipChange(
        joinRequest.teamId,
        joinRequest.userId,
        session.user.id,
        'ADDED',
        undefined,
        'MEMBER',
        reason
      );
    }

    revalidatePath(`/main/teams/${joinRequest.teamId}`);
    revalidatePath(`/main/teams/${joinRequest.teamId}/members`);
    revalidatePath('/main/teams');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to respond to team join request:', error);
    return {
      error: 'Failed to respond to join request. Please try again.',
    };
  }
}

/**
 * Cancel a team join request
 */
export async function cancelTeamJoinRequest(
  teamId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    // Find and delete the pending join request
    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId
        }
      }
    });

    if (!joinRequest) {
      return { error: 'Join request not found' };
    }

    if (joinRequest.status !== 'PENDING') {
      return { error: 'Cannot cancel a processed request' };
    }

    await prisma.teamJoinRequest.delete({
      where: { id: joinRequest.id }
    });

    revalidatePath(`/main/teams/${teamId}`);
    revalidatePath('/main/teams');
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel team join request:', error);
    return {
      error: 'Failed to cancel join request. Please try again.',
    };
  }
}

/**
 * Get team join requests (for team owners/leads)
 */
export async function getTeamJoinRequests(teamId: string) {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    // Check if user has permission to view join requests
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isTeamOwner = team.ownerId === session.user.id;
    
    const teamMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId
        }
      }
    });
    const isTeamLead = teamMembership?.role === 'LEAD';

    if (!isAdmin && !isTeamOwner && !isTeamLead) {
      return { error: 'You do not have permission to view join requests' };
    }

    const joinRequests = await prisma.teamJoinRequest.findMany({
      where: {
        teamId,
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
    console.error('Failed to get team join requests:', error);
    return { error: 'Failed to load join requests' };
  }
}

/**
 * Get user's team join request status
 */
export async function getUserTeamJoinRequestStatus(teamId: string) {
  try {
    const session = await auth();
    if (!session) {
      return null;
    }

    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId
        }
      }
    });

    return joinRequest;
  } catch (error) {
    console.error('Failed to get team join request status:', error);
    return null;
  }
}