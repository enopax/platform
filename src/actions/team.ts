'use server';

import { revalidatePath } from 'next/cache';
import { teamService } from '@/lib/services/team';
import { userService } from '@/lib/services/user';
import { auth } from '@/lib/auth';

export interface UpdateTeamState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    description?: string;
    color?: string;
    organisationId?: string;
    ownerId?: string;
  };
}

export interface CreateTeamState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    description?: string;
    color?: string;
    organisationId?: string;
    ownerId?: string;
  };
}

export async function updateTeam(
  teamId: string,
  prevState: UpdateTeamState,
  formData: FormData
): Promise<UpdateTeamState> {
  try {
    const session = await auth();
    const ownerId = session?.user.id;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const organisationId = formData.get('organisationId') as string;
    const isActive = formData.get('isActive') === 'true';

    // Basic validation
    if (!name || name.trim().length < 2) {
      return {
        error: 'Team name must be at least 2 characters long',
        fieldErrors: { name: 'Team name must be at least 2 characters long' }
      };
    }

    if (!organisationId) {
      return {
        error: 'Organisation is required',
        fieldErrors: { organisationId: 'Organisation is required' }
      };
    }

    if (!ownerId) {
      return {
        error: 'Owner is required',
        fieldErrors: { ownerId: 'Owner is required' }
      };
    }

    // Validate owner exists
    const ownerExists = await userService.validateUserExists(ownerId);
    if (!ownerExists) {
      return {
        error: 'Selected owner does not exist',
        fieldErrors: { ownerId: 'Selected owner does not exist' }
      };
    }

    // Check for duplicate team name within the organisation (excluding current team)
    const isNameAvailable = await teamService.validateTeamName(name.trim(), organisationId, teamId);
    if (!isNameAvailable) {
      return {
        error: 'A team with this name already exists in the organisation',
        fieldErrors: { name: 'A team with this name already exists in the organisation' }
      };
    }

    // Validate color format if provided
    if (color && color.trim() && !color.match(/^#[0-9A-F]{6}$/i)) {
      return {
        error: 'Color must be a valid hex color code (e.g., #FF0000)',
        fieldErrors: { color: 'Color must be a valid hex color code (e.g., #FF0000)' }
      };
    }

    // Use service to update team
    await teamService.updateTeam(teamId, ownerId, {
      name: name.trim(),
      description: description?.trim() || undefined,
      color: color?.trim() || undefined,
      organisationId,
    });

    revalidatePath('/admin/team');
    revalidatePath(`/admin/team/${teamId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update team:', error);
    return {
      error: 'Failed to update team. Please try again.',
    };
  }
}

export async function createTeam(
  prevState: CreateTeamState,
  formData: FormData
): Promise<CreateTeamState> {
  try {
    const session = await auth();
    const ownerId = session?.user.id;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const organisationId = formData.get('organisationId') as string;

    // Basic validation
    if (!name || name.trim().length < 2) {
      return {
        error: 'Team name must be at least 2 characters long',
        fieldErrors: { name: 'Team name must be at least 2 characters long' }
      };
    }

    if (!organisationId) {
      return {
        error: 'Organisation is required',
        fieldErrors: { organisationId: 'Organisation is required' }
      };
    }

    if (!ownerId) {
      return {
        error: 'Owner is required',
        fieldErrors: { ownerId: 'Owner is required' }
      };
    }

    // Validate owner exists
    const ownerExists = await userService.validateUserExists(ownerId);
    if (!ownerExists) {
      return {
        error: 'Selected owner does not exist',
        fieldErrors: { ownerId: 'Selected owner does not exist' }
      };
    }

    // Check for duplicate team name within the organisation
    const isNameAvailable = await teamService.validateTeamName(name.trim(), organisationId);
    if (!isNameAvailable) {
      return {
        error: 'A team with this name already exists in the organisation',
        fieldErrors: { name: 'A team with this name already exists in the organisation' }
      };
    }

    // Validate color format if provided
    if (color && color.trim() && !color.match(/^#[0-9A-F]{6}$/i)) {
      return {
        error: 'Color must be a valid hex color code (e.g., #FF0000)',
        fieldErrors: { color: 'Color must be a valid hex color code (e.g., #FF0000)' }
      };
    }

    // Use service to create team
    await teamService.createTeam(ownerId, {
      name: name.trim(),
      description: description?.trim() || undefined,
      color: color?.trim() || undefined,
      organisationId,
    });
    revalidatePath('/main/teams');

    return { success: true };
  } catch (error) {
    console.error('Failed to create team:', error);
    return {
      error: 'Failed to create team. Please try again.',
    };
  }
}

// Real database team search function
export async function findTeams(query: string) {
  try {
    // Use service to search teams (this would need to be implemented in the service)
    const teams = await teamService.searchTeams(query);
    return teams;
  } catch (error) {
    console.error('Failed to search teams:', error);
    return [];
  }
}