import type { Metadata } from 'next';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Sign In',
  description: process.env.NEXT_PUBLIC_META_DESC,
  openGraph: {
    images: [process.env.NEXT_PUBLIC_OG_IMAGE ||  ''],
  },
};

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (session) return redirect(`/`);

  return (
    <div className="max-w-6xl m-auto">
      {children}
    </div>
  );
}
