import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session) return redirect(`/`);

  return (
    <div className="max-w-4xl m-auto">
      {children}
    </div>
  );
}
