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

    // Fetch user's organisation memberships or all organisations for admin
    const organisations = isAdmin
      ? await prisma.organisation.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        })
      : await prisma.organisation.findMany({
          where: {
            isActive: true,
            members: {
              some: {
                userId: session.user.id
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

    return NextResponse.json({
      organisations,
      userRole: session.user.role
    });
  } catch (error) {
    console.error('Error fetching user organisations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}