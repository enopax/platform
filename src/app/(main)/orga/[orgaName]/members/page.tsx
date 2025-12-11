import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MembersManagementClient } from '@/components/MembersManagementClient';

interface MembersManagementPageProps {
  params: Promise<{ orgaName: string }>;
}

export default async function MembersManagementPage({ params }: MembersManagementPageProps) {
  const { orgaName } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  // Validate that orgaName is provided
  if (!orgaName) {
    notFound();
  }

  // Get organisation by name
  const organisation = await prisma.organisation.findUnique({
    where: { name: orgaName },
    select: { id: true }
  });
  if (!organisation) notFound();
  const organisationId = organisation.id;

  // Check if user is the owner or admin
  const isAdmin = session.user.role === 'ADMIN';

  // Check if user is a member of this organisation
  const membership = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId
      }
    }
  });

  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';

  if (!membership && !isAdmin) {
    notFound();
  }

  // Only owners, managers, and admins can access member management
  if (!isOwner && !isManager && !isAdmin) {
    notFound();
  }

  // Fetch members and join requests only (organisation data comes from context)
  const [members, joinRequests] = await Promise.all([
    prisma.organisationMember.findMany({
      where: { organisationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstname: true,
            lastname: true,
            email: true,
            image: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' }
      ]
    }),
    prisma.organisationJoinRequest.findMany({
      where: {
        organisationId,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstname: true,
            lastname: true,
            email: true,
            image: true,
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    })
  ]);

  return (
    <MembersManagementClient
      members={members}
      joinRequests={joinRequests}
      isOwner={isOwner}
      isManager={isManager}
      isAdmin={isAdmin}
      currentUserId={session.user.id}
    />
  );
}
