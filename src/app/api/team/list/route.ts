import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { teamService } from '@/lib/services/team';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organisationId = searchParams.get('organisationId');

    let teams;

    if (organisationId) {
      // Get teams for a specific organisation
      teams = await teamService.getOrganisationTeams(organisationId, session.user.id);
    } else {
      // Get user's teams across all organisations
      teams = await teamService.getUserTeams(session.user.id);
    }

    return NextResponse.json({
      success: true,
      teams: teams.map(team => ({
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
      })),
    });

  } catch (error) {
    console.error('List teams error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}