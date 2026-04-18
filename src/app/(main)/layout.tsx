import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import Container from '@/components/common/Container';
import { Card } from '@/components/common/Card';
import { RiTimeLine } from '@remixicon/react';

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  if (session.user?.role === 'GUEST') {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-lg p-8 text-center">
          <div className="inline-flex p-3 bg-brand-100 dark:bg-brand-900/30 rounded-full mb-4">
            <RiTimeLine className="h-8 w-8 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Thanks for registering!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Your account is on the early access list. We&apos;ll notify you when your access is activated.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Signed in as {session.user.email}
          </p>
        </Card>
      </main>
    );
  }

  return (
    <>
      {session.user && !session.user.emailVerified && <EmailVerificationBanner />}
      {children}
    </>
  );
}
