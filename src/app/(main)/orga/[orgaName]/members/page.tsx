import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
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

  if (!orgaName) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(orgaName);
  if (!organisation) notFound();
  const organisationId = organisation.id;

  const isAdmin = session.user.role === 'ADMIN';

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisationId);

  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';

  if (!membership && !isAdmin) {
    notFound();
  }

  if (!isOwner && !isManager && !isAdmin) {
    notFound();
  }

  const [storeMembers, joinRequests] = await Promise.all([
    store.organisationMembers.findByOrgId(organisationId),
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

  const members = await Promise.all(
    storeMembers.map(async (m) => {
      const user = await store.users.findById(m.userId);
      return {
        id: m.id,
        userId: m.userId,
        organisationId: m.organisationId,
        role: m.role,
        joinedAt: m.joinedAt,
        updatedAt: m.updatedAt,
        user: {
          id: m.userId,
          name: user?.name ?? null,
          firstname: user?.firstname ?? null,
          lastname: user?.lastname ?? null,
          email: user?.email ?? '',
          image: user?.image ?? null,
        },
      };
    })
  );

  const roleOrder = { OWNER: 0, MANAGER: 1, MEMBER: 2 };
  members.sort((a, b) => {
    const roleCompare = (roleOrder[a.role as keyof typeof roleOrder] ?? 3) - (roleOrder[b.role as keyof typeof roleOrder] ?? 3);
    if (roleCompare !== 0) return roleCompare;
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  });

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
