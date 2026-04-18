import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
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

  if (!orgaName) {
    notFound();
  }

  const store = await getStoreAsync();
  const orgLookup = await store.organisations.findByName(orgaName);
  if (!orgLookup) notFound();
  const organisationId = orgLookup.id;

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisationId);

  const isAdmin = session.user.role === 'SUPERADMIN';
  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';

  if (!membership && !isAdmin) {
    notFound();
  }

  const storeMembers = await store.organisationMembers.findByOrgId(organisationId);

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

  if (!members) {
    notFound();
  }

  return (
    <RolesManagementClient
      members={members as { id: string; role: 'OWNER' | 'MANAGER' | 'MEMBER'; joinedAt: Date; updatedAt: Date; user: { id: string; name: string | null; firstname: string | null; lastname: string | null; email: string; image: string | null } }[]}
    />
  );
}
