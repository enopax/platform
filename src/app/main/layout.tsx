import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import SidebarNavigation from '@/components/SidebarNavigation';
import MobileNavigation from '@/components/MobileNavigation';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  //if (!session) return redirect('/');

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <SidebarNavigation user={session?.user} />
      </div>

      {/* Mobile Navigation - Visible only on mobile */}
      <MobileNavigation user={session?.user} />

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-6 pt-0 lg:pt-6">
        {children}
      </main>
    </div>
  );
}