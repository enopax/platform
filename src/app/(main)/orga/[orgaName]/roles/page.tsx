import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RolesManagementClient } from '@/components/RolesManagementClient';

interface RolesPageProps {
  params: Promise<{ orgaName: string }>;
}

export default async function RolesPage({ params }: RolesPageProps) {
  const { orgaName } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  // Validate that orgaName is provided
  if (!orgaName) {
    notFound();
  }

  // Get organisation by orgaName first
  const orgLookup = await prisma.organisation.findUnique({
    where: { name: orgaName },
    select: { id: true }
  });
  if (!orgLookup) notFound();
  const organisationId = orgLookup.id;

  // Check if user is a member of this organisation
  const membership = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId
      }
    }
  });

  const isAdmin = session.user.role === 'ADMIN';
  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';

  if (!membership && !isAdmin) {
    notFound();
  }

  // Fetch the organisation members
  const members = await prisma.organisationMember.findMany({
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
  });

  if (!members) {
    notFound();
  }

  return (
    <RolesManagementClient
      members={members}
    />
  );
}
