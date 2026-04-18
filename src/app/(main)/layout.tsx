import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import GuestWaitingPage from '@/components/GuestWaitingPage';

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
    return <GuestWaitingPage email={session.user.email || ''} />;
  }

  return (
    <>
      {session.user && !session.user.emailVerified && <EmailVerificationBanner />}
      {children}
    </>
  );
}
