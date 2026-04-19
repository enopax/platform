import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { OrganisationsClient } from '@/components/OrganisationsClient';
import { redirect } from 'next/navigation';

export default async function OrganisationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/auth/signin');
  }

  const store = await getStoreAsync();

  const userMemberships = await store.organisationMembers.findByUserId(session.user.id);
  const memberOrgIds = new Set(userMemberships.map(m => m.organisationId));

  const allOrgs = await store.organisations.search('', 1000);
  const activeOrgs = allOrgs.filter(org =>
    org.isActive && (org.ownerId === session.user.id || memberOrgIds.has(org.id))
  );

  const organisations = await Promise.all(
    activeOrgs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(async (org) => {
        const owner = await store.users.findById(org.ownerId);
        const members = await store.organisationMembers.findByOrgId(org.id);
        const membership = userMemberships.find(m => m.organisationId === org.id);
        const userIsAdmin = org.ownerId === session.user.id || membership?.role === 'OWNER' || membership?.role === 'ADMIN';
        return {
          id: org.id,
          name: org.name,
          description: org.description,
          isActive: org.isActive,
          visibility: (org as any).visibility || 'PUBLIC',
          isUserAdmin: userIsAdmin,
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
