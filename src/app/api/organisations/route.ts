import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';

    // Fetch user's organisation memberships
    const organisationMemberships = isAdmin
      ? await prisma.organisation.findMany({
          where: { isActive: true },
          include: {
            _count: {
              select: {
                members: true,
                teams: true,
                projects: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }).then(orgs => orgs.map(org => ({
          ...org,
          role: 'ADMIN' as const
        })))
      : await prisma.organisationMember.findMany({
          where: {
            userId: session.user.id,
            organisation: {
              isActive: true
            }
          },
          include: {
            organisation: {
              include: {
                _count: {
                  select: {
                    members: true,
                    teams: true,
                    projects: true
                  }
                }
              }
            }
          },
          orderBy: { joinedAt: 'desc' }
        }).then(memberships => memberships.map(m => ({
          ...m.organisation,
          role: m.role
        })));

    return NextResponse.json({ organisations: organisationMemberships });
  } catch (error) {
    console.error('Error fetching organisations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}