import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { teamService, CreateTeamData } from '@/lib/services/team';

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
    const data: Partial<CreateTeamData> = await request.json();

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