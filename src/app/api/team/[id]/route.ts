import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { teamService, CreateTeamData } from '@/lib/services/team';
import { z } from 'zod';
import { TeamVisibility } from '@prisma/client';

const updateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  visibility: z.nativeEnum(TeamVisibility).optional(),
  allowJoinRequests: z.boolean().optional(),
  maxMembers: z.number().min(1).max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = params;

    // Check if user is a member of the team
    const isMember = await teamService.isUserMember(session.user.id, teamId);
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get team details
    const team = await teamService.getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        color: team.color,
        visibility: team.visibility,
        allowJoinRequests: team.allowJoinRequests,
        maxMembers: team.maxMembers,
        tags: team.tags,
        organisationId: team.organisationId,
        ownerId: team.ownerId,
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        memberCount: team.memberCount,
        projectCount: team.projectCount,
      },
    });

  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = params;

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validation = updateTeamSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data: Partial<CreateTeamData> = validation.data;

    // If updating name, check if it's available within the organisation
    if (data.name) {
      const team = await teamService.getTeamById(teamId);
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      const isNameAvailable = await teamService.validateTeamName(
        data.name,
        team.organisationId,
        teamId
      );
      if (!isNameAvailable) {
        return NextResponse.json(
          { error: 'Team name is already taken within this organisation' },
          { status: 409 }
        );
      }
    }

    // Update the team
    const updatedTeam = await teamService.updateTeam(teamId, session.user.id, data);

    return NextResponse.json({
      success: true,
      team: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        description: updatedTeam.description,
        color: updatedTeam.color,
        visibility: updatedTeam.visibility,
        allowJoinRequests: updatedTeam.allowJoinRequests,
        maxMembers: updatedTeam.maxMembers,
        tags: updatedTeam.tags,
        organisationId: updatedTeam.organisationId,
        ownerId: updatedTeam.ownerId,
        isActive: updatedTeam.isActive,
        createdAt: updatedTeam.createdAt,
        updatedAt: updatedTeam.updatedAt,
        memberCount: updatedTeam.memberCount,
        projectCount: updatedTeam.projectCount,
      },
    });

  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = params;

    // Delete the team (soft delete)
    await teamService.deleteTeam(teamId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully',
    });

  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}