import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { OrganisationsClient } from '@/components/OrganisationsClient';
import { redirect } from 'next/navigation';

export default async function OrganisationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/auth/signin');
  }

  const isAdmin = session.user.role === 'ADMIN';
  const store = await getStoreAsync();

  let activeOrgs;
  if (isAdmin) {
    activeOrgs = await store.organisations.search('', 1000);
  } else {
    const memberships = await store.organisationMembers.findByUserId(session.user.id);
    const memberOrgIds = new Set(memberships.map(m => m.organisationId));
    const allOrgs = await store.organisations.search('', 1000);
    activeOrgs = allOrgs.filter(org => memberOrgIds.has(org.id));
  }

  const organisations = await Promise.all(
    activeOrgs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(async (org) => {
        const owner = await store.users.findById(org.ownerId);
        const members = await store.organisationMembers.findByOrgId(org.id);
        return {
          id: org.id,
          name: org.name,
          description: org.description,
          isActive: org.isActive,
          createdAt: org.createdAt,
          owner: {
            name: owner?.name ?? null,
            firstname: owner?.firstname ?? null,
            lastname: owner?.lastname ?? null,
            email: owner?.email ?? '',
          },
          _count: {
            projects: 0,
            members: members.length,
            resources: 0,
          },
        };
      })
  );

  return <OrganisationsClient organisations={organisations} />;
}
