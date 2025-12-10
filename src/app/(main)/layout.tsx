import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  return children;
}
