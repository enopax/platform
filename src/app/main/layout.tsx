import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import SidebarNavigation from '@/components/SidebarNavigation';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  //if (!session) return redirect('/');

  return (
    <div className="flex min-h-screen">
      <SidebarNavigation user={session?.user} />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}