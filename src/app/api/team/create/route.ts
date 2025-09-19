import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { teamService, CreateTeamData } from '@/lib/services/team';
import { z } from 'zod';
import { TeamVisibility } from '@prisma/client';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  visibility: z.nativeEnum(TeamVisibility).optional(),
  allowJoinRequests: z.boolean().optional(),
  maxMembers: z.number().min(1).max(1000).optional(),
  tags: z.array(z.string()).optional(),
  organisationId: z.string().min(1, 'Organisation ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validation = createTeamSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data: CreateTeamData = validation.data;

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