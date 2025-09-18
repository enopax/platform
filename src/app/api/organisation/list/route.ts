import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { organisationService } from '@/lib/services/organisation';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organisations
    const organisations = await organisationService.getUserOrganisations(session.user.id);

    return NextResponse.json({
      success: true,
      organisations: organisations.map(org => ({
        id: org.id,
        name: org.name,
        description: org.description,
        website: org.website,
        address: org.address,
        phone: org.phone,
        email: org.email,
        logo: org.logo,
        isActive: org.isActive,
        ownerId: org.ownerId,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        memberCount: org.memberCount,
        teamCount: org.teamCount,
        projectCount: org.projectCount,
      })),
    });

  } catch (error) {
    console.error('List organisations error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}