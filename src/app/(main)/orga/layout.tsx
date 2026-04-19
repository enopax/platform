import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import SidebarNavigation from '@/components/navigation/SidebarNavigation';
import MobileNavigation from '@/components/navigation/MobileNavigation';

async function getUserOrganisations(userId: string) {
  const store = await getStoreAsync();
  const memberships = await store.organisationMembers.findByUserId(userId);
  const memberOrgIds = new Set(memberships.map(m => m.organisationId));

  const allOrgs = await store.organisations.search('', 1000);
  const userOrgs = allOrgs.filter(org =>
    org.isActive && (org.ownerId === userId || memberOrgIds.has(org.id))
  );

  const orgDataPromises = userOrgs
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(async (org) => {
      const projects = await store.projects.findByOrgId(org.id, { isActive: true });
      return {
        id: org.id,
        name: org.name,
        projects: projects.map(p => ({ id: p.id, name: p.name, status: p.status })),
      };
    });

  return Promise.all(orgDataPromises);
}

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  let organisations: { id: string; name: string; projects: { id: string; name: string; status: string }[] }[] = [];

  if (session?.user?.id) {
    try {
      organisations = await getUserOrganisations(session.user.id);
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    }
  }

  return (
    <div className="flex">
      <div className="hidden lg:block sticky top-0 h-screen overflow-y-auto">
        <SidebarNavigation organisations={organisations} />
      </div>

      <MobileNavigation organisations={organisations} />

      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
