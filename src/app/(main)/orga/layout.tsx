import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

  let organisations = [];

  if (session?.user?.id) {
    try {
      // Fetch all user organisations with their projects
      organisations = await prisma.organisation.findMany({
        where: {
          OR: [
            { ownerId: session.user.id },
            {
              members: {
                some: { userId: session.user.id }
              }
            }
          ],
          isActive: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: {
              projects: true,
              members: true
            }
          },
        },
        orderBy: { name: 'asc' }
      });
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