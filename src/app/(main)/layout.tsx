import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  return (
    <>
      {session.user && !session.user.emailVerified && <EmailVerificationBanner />}
      {children}
    </>
  );
}
