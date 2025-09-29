import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id: organisationId } = await params;

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

    // Fetch projects in this organisation
    const projects = await prisma.project.findMany({
      where: {
        organisationId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        organisationId: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching organisation projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}