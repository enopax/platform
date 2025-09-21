import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { teamService, CreateTeamData } from '@/lib/services/team';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data: CreateTeamData = await request.json();

    // Check if team name is already taken within the organisation
    const isNameAvailable = await teamService.validateTeamName(data.name, data.organisationId);
    if (!isNameAvailable) {
      return NextResponse.json(
        { error: 'Team name is already taken within this organisation' },
        { status: 409 }
      );
    }

    // Create the team
    const team = await teamService.createTeam(session.user.id, data);

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
        memberCount: team.memberCount,
        projectCount: team.projectCount,
      },
    });

  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}