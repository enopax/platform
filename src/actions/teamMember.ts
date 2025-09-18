'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { TeamRole } from '@prisma/client';
import { logTeamMembershipChange } from '@/lib/auditLog';

export interface AddTeamMemberState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    userId?: string;
    role?: string;
  };
}

export interface UpdateMemberRoleState {
  success?: boolean;
  error?: string;
}

export interface RemoveMemberState {
  success?: boolean;
  error?: string;
}

export async function addTeamMember(
  teamId: string,
  prevState: AddTeamMemberState,
  formData: FormData
): Promise<AddTeamMemberState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    const userId = formData.get('userId') as string;
    const role = (formData.get('role') as TeamRole) || 'MEMBER';

    // Basic validation
    if (!userId) {
      return {
        error: 'User is required',
        fieldErrors: { userId: 'User is required' }
      };
    }

    // Check if team exists and user has permission to manage it
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    // Check permissions - user must be owner or team lead
    const isOwner = team.ownerId === session.user.id;
    const isTeamLead = team.members.some(m => m.userId === session.user.id && m.role === 'LEAD');
    
    if (!isOwner && !isTeamLead) {
      return { error: 'You do not have permission to manage this team' };
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return {
        error: 'Selected user does not exist',
        fieldErrors: { userId: 'Selected user does not exist' }
      };
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    });

    if (existingMember) {
      return {
        error: 'User is already a member of this team',
        fieldErrors: { userId: 'User is already a member of this team' }
      };
    }

    // Check if user is the team owner (they don't need to be added as member)
    if (team.ownerId === userId) {
      return {
        error: 'Team owner is automatically a member',
        fieldErrors: { userId: 'Team owner is automatically a member' }
      };
    }

    // Add the team member
    await prisma.teamMember.create({
      data: {
        userId,
        teamId,
        role,
      },
    });

    // Log the addition
    await logTeamMembershipChange(
      teamId,
      userId,
      session.user.id,
      'ADDED',
      undefined,
      role
    );

    revalidatePath(`/main/teams/${teamId}`);
    revalidatePath(`/main/teams/${teamId}/manage`);
    revalidatePath(`/main/teams/${teamId}/members`);

    return { success: true };
  } catch (error) {
    console.error('Failed to add team member:', error);
    return {
      error: 'Failed to add team member. Please try again.',
    };
  }
}

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  role: TeamRole
): Promise<UpdateMemberRoleState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    // Check if team exists and user has permission to manage it
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    // Check permissions - user must be owner or team lead
    const isOwner = team.ownerId === session.user.id;
    const isTeamLead = team.members.some(m => m.userId === session.user.id && m.role === 'LEAD');
    
    if (!isOwner && !isTeamLead) {
      return { error: 'You do not have permission to manage this team' };
    }

    // Get current member data for audit log
    const currentMember = await prisma.teamMember.findUnique({
      where: {
        id: memberId,
        teamId
      }
    });

    if (!currentMember) {
      return { error: 'Member not found' };
    }

    // Update member role
    await prisma.teamMember.update({
      where: {
        id: memberId,
        teamId // Ensure member belongs to this team
      },
      data: { role }
    });

    // Log the role change
    await logTeamMembershipChange(
      teamId,
      currentMember.userId,
      session.user.id,
      'ROLE_CHANGED',
      currentMember.role,
      role
    );

    revalidatePath(`/main/teams/${teamId}`);
    revalidatePath(`/main/teams/${teamId}/manage`);
    revalidatePath(`/main/teams/${teamId}/members`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update member role:', error);
    return { error: 'Failed to update member role. Please try again.' };
  }
}

export async function removeMember(
  teamId: string,
  userId: string
): Promise<RemoveMemberState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    // Check if team exists and user has permission to manage it
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    // Check permissions - user must be owner or team lead
    const isOwner = team.ownerId === session.user.id;
    const isTeamLead = team.members.some(m => m.userId === session.user.id && m.role === 'LEAD');
    
    if (!isOwner && !isTeamLead) {
      return { error: 'You do not have permission to manage this team' };
    }

    // Get member to check if they're trying to remove themselves or owner
    const member = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    });

    if (!member) {
      return { error: 'Member not found' };
    }

    // Don't allow removing the team owner (they shouldn't be in members table anyway)
    if (member.userId === team.ownerId) {
      return { error: 'Cannot remove team owner' };
    }

    // Remove the member
    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    });

    // Log the removal
    await logTeamMembershipChange(
      teamId,
      userId,
      session.user.id,
      'REMOVED',
      member.role,
      undefined
    );

    revalidatePath(`/main/teams/${teamId}`);
    revalidatePath(`/main/teams/${teamId}/manage`);
    revalidatePath(`/main/teams/${teamId}/members`);

    return { success: true };
  } catch (error) {
    console.error('Failed to remove member:', error);
    return { error: 'Failed to remove member. Please try again.' };
  }
}

export async function promoteMember(
  teamId: string,
  userId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    // Check if team exists and user is owner
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    // Only owners can promote/demote
    if (team.ownerId !== session.user.id) {
      return { error: 'You do not have permission to promote members' };
    }

    // Update member role to LEAD
    await prisma.teamMember.update({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      },
      data: { role: 'LEAD' }
    });

    // Log the promotion
    await logTeamMembershipChange(
      teamId,
      userId,
      session.user.id,
      'PROMOTED',
      'MEMBER',
      'LEAD'
    );

    revalidatePath(`/main/teams/${teamId}`);
    revalidatePath(`/main/teams/${teamId}/manage`);
    revalidatePath(`/main/teams/${teamId}/members`);

    return { success: true };
  } catch (error) {
    console.error('Failed to promote member:', error);
    return { error: 'Failed to promote member. Please try again.' };
  }
}

export async function demoteMember(
  teamId: string,
  userId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    // Check if team exists and user is owner
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    // Only owners can promote/demote
    if (team.ownerId !== session.user.id) {
      return { error: 'You do not have permission to demote members' };
    }

    // Update member role to MEMBER
    await prisma.teamMember.update({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      },
      data: { role: 'MEMBER' }
    });

    // Log the demotion
    await logTeamMembershipChange(
      teamId,
      userId,
      session.user.id,
      'DEMOTED',
      'LEAD',
      'MEMBER'
    );

    revalidatePath(`/main/teams/${teamId}`);
    revalidatePath(`/main/teams/${teamId}/manage`);
    revalidatePath(`/main/teams/${teamId}/members`);

    return { success: true };
  } catch (error) {
    console.error('Failed to demote member:', error);
    return { error: 'Failed to demote member. Please try again.' };
  }
}