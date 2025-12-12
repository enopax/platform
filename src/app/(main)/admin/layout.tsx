import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AdminNavigation from '@/components/navigation/AdminNavigation';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session) return redirect(`/`);

  return (
    <div className="max-w-6xl m-auto">
      <AdminNavigation />
      {children}
    </div>
  );
}
