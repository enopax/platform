'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const organisationId = formData.get('organisationId') as string;
    const ownerId = formData.get('ownerId') as string;
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

    // Validate organisation exists
    const organisationExists = await prisma.organisation.findUnique({
      where: { id: organisationId }
    });

    if (!organisationExists) {
      return {
        error: 'Selected organisation does not exist',
        fieldErrors: { organisationId: 'Selected organisation does not exist' }
      };
    }

    // Validate owner exists
    const ownerExists = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (!ownerExists) {
      return {
        error: 'Selected owner does not exist',
        fieldErrors: { ownerId: 'Selected owner does not exist' }
      };
    }

    // Check for duplicate team name within the organisation (excluding current team)
    const duplicateTeam = await prisma.team.findFirst({
      where: {
        name: name.trim(),
        organisationId,
        NOT: { id: teamId }
      }
    });

    if (duplicateTeam) {
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

    await prisma.team.update({
      where: { id: teamId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color?.trim() || null,
        organisationId,
        ownerId,
        isActive,
      },
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
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const organisationId = formData.get('organisationId') as string;
    const ownerId = formData.get('ownerId') as string;

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

    // Validate organisation exists
    const organisationExists = await prisma.organisation.findUnique({
      where: { id: organisationId }
    });

    if (!organisationExists) {
      return {
        error: 'Selected organisation does not exist',
        fieldErrors: { organisationId: 'Selected organisation does not exist' }
      };
    }

    // Validate owner exists
    const ownerExists = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (!ownerExists) {
      return {
        error: 'Selected owner does not exist',
        fieldErrors: { ownerId: 'Selected owner does not exist' }
      };
    }

    // Check for duplicate team name within the organisation
    const duplicateTeam = await prisma.team.findFirst({
      where: {
        name: name.trim(),
        organisationId
      }
    });

    if (duplicateTeam) {
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

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color?.trim() || null,
        organisationId,
        ownerId,
      },
    });

    // Also add the owner as a team member with LEAD role
    await prisma.teamMember.create({
      data: {
        userId: ownerId,
        teamId: team.id,
        role: 'LEAD',
      },
    });

    revalidatePath('/admin/team');
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
    // Search teams by name or description
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        isActive: true, // Only show active teams
      },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        organisationId: true,
        organisation: {
          select: {
            name: true,
          },
        },
        owner: {
          select: {
            name: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { name: 'asc' },
      ],
      take: 10, // Limit to 10 results
    });

    return teams;
  } catch (error) {
    console.error('Failed to search teams:', error);
    return [];
  }
}