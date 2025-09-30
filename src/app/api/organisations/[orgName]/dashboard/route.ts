import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const organisationId = params.id;

    // Check if user has access to this organisation
    const isAdmin = session.user.role === 'ADMIN';
    const membership = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId: organisationId
        }
      }
    });

    if (!isAdmin && !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch organisation data
    const [projects, teams, resources, counts] = await Promise.all([
      // Get recent projects
      prisma.project.findMany({
        where: {
          organisationId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),

      // Get teams with member counts
      prisma.team.findMany({
        where: {
          organisationId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          teamType: true,
          _count: {
            select: { members: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Get resources
      prisma.resource.findMany({
        where: {
          organisationId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Get counts
      Promise.all([
        prisma.project.count({
          where: { organisationId, isActive: true }
        }),
        prisma.team.count({
          where: { organisationId, isActive: true }
        }),
        prisma.resource.count({
          where: { organisationId, isActive: true }
        }),
        prisma.organisationMember.count({
          where: { organisationId }
        })
      ])
    ]);

    const [projectCount, teamCount, resourceCount, memberCount] = counts;

    const dashboardData = {
      projects: projects.map(p => ({
        ...p,
        updatedAt: p.updatedAt.toISOString()
      })),
      teams: teams.map(t => ({
        id: t.id,
        name: t.name,
        teamType: t.teamType,
        memberCount: t._count.members
      })),
      resources,
      counts: {
        projects: projectCount,
        teams: teamCount,
        resources: resourceCount,
        members: memberCount
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching organisation dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}