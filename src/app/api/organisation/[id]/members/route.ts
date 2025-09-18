import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { organisationService } from '@/lib/services/organisation';

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

    const { id: organisationId } = params;

    // Check if user is a member of the organisation
    const isMember = await organisationService.isUserMember(session.user.id, organisationId);
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get organisation members
    const members = await organisationService.getOrganisationMembers(organisationId);

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
    console.error('Get organisation members error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}