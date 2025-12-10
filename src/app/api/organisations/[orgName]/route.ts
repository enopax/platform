import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { orgName: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const orgName = params.orgName;

    // Validate that orgName is provided
    if (!orgName) {
      return NextResponse.json({ error: 'Organisation name is required' }, { status: 400 });
    }

    // Get organisation by name
    const organisation = await prisma.organisation.findUnique({
      where: { name: orgName },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true
      }
    });

    if (!organisation) {
      return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
    }

    // Check if user has access to this organisation
    const isAdmin = session.user.role === 'ADMIN';
    const membership = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId: organisation.id
        }
      }
    });

    if (!isAdmin && !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(organisation);
  } catch (error) {
    console.error('Error fetching organisation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}