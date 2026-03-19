import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import SidebarNavigation from '@/components/navigation/SidebarNavigation';
import MobileNavigation from '@/components/navigation/MobileNavigation';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  //if (!session) return redirect('/');

  // Note: We can't extract organisationId from URL in layout
  // The sidebar will handle organisation context detection client-side from pathname
  // We fetch all organisations with their projects for the sidebar

  let organisations: { id: string; name: string; description: string | null; _count: { projects: number; members: number } }[] = [];

  if (session?.user?.id) {
    try {
      const store = await getStoreAsync();
      const memberships = await store.organisationMembers.findByUserId(session.user.id);
      const memberOrgIds = new Set(memberships.map(m => m.organisationId));

      const allOrgs = await store.organisations.search('', 1000);
      const userOrgs = allOrgs.filter(org =>
        org.isActive && (org.ownerId === session.user.id || memberOrgIds.has(org.id))
      );

      const orgDataPromises = userOrgs
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(async (org) => {
          const memberCount = memberships.filter(m => m.organisationId === org.id).length ||
            (org.ownerId === session.user.id ? 1 : 0);
          const projects = await store.projects.findByOrgId(org.id, { isActive: true });
          return {
            id: org.id,
            name: org.name,
            description: org.description,
            _count: { projects: projects.length, members: memberCount },
          };
        });
      organisations = await Promise.all(orgDataPromises);
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    }
  }

  return (
    <div className="flex pt-10 lg:pt-5">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block sticky top-0 h-screen overflow-y-auto">
        <SidebarNavigation
          user={session?.user}
          organisations={organisations}
        />
      </div>

      {/* Mobile Navigation - Visible only on mobile */}
      <MobileNavigation user={session?.user} organisations={organisations} />

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-6 pt-5 lg:pt-6">
        {children}
      </main>
    </div>
  );
}