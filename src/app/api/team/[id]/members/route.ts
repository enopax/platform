import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { teamService } from '@/lib/services/team';
import { z } from 'zod';
import { TeamRole } from '@prisma/client';

const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.nativeEnum(TeamRole).optional(),
});

const removeMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
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

    // Get team members
    const members = await teamService.getTeamMembers(teamId);

    return NextResponse.json({
      success: true,
      members: members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
        },
      })),
    });

  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const validation = addMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { userId, role } = validation.data;

    // Add the team member
    await teamService.addTeamMember(teamId, userId, session.user.id, role);

    return NextResponse.json({
      success: true,
      message: 'Team member added successfully',
    });

  } catch (error) {
    console.error('Add team member error:', error);
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

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validation = removeMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { userId } = validation.data;

    // Remove the team member
    await teamService.removeTeamMember(teamId, userId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    });

  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}