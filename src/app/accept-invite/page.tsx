import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { RiAlertLine, RiMailSendLine } from '@remixicon/react';
import AcceptInvitationButton from '@/components/invitation/AcceptInvitationButton';

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <ErrorCard title="Missing token" message="The invitation link is missing its token. Ask the admin for a new invite." />
    );
  }

  const store = await getStoreAsync();
  const invitation = await store.invitations.findByToken(token);

  if (!invitation) {
    return <ErrorCard title="Invitation not found" message="This link is invalid or has been removed." />;
  }

  if (invitation.status === 'ACCEPTED') {
    const organisation = await store.organisations.findById(invitation.organisationId);
    return (
      <ErrorCard
        title="Already accepted"
        message={`This invitation has already been used.${organisation ? ` Go to ${organisation.name}.` : ''}`}
        actionLabel={organisation ? `Open ${organisation.name}` : undefined}
        actionHref={organisation ? `/${organisation.name}` : undefined}
      />
    );
  }

  if (invitation.status === 'REVOKED') {
    return <ErrorCard title="Invitation revoked" message="The admin revoked this invite. Ask them for a new one." />;
  }

  if (invitation.expiresAt < new Date() || invitation.status === 'EXPIRED') {
    return <ErrorCard title="Invitation expired" message="This invite has expired. Ask the admin for a new one." />;
  }

  const organisation = await store.organisations.findById(invitation.organisationId);
  if (!organisation) {
    return <ErrorCard title="Organisation unavailable" message="The inviting organisation no longer exists." />;
  }

  const session = await auth();
  const invitedUser = await store.users.findByEmail(invitation.email);
  const acceptHref = encodeURIComponent(`/accept-invite?token=${token}`);

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-brand-100 dark:bg-brand-900/30 rounded-full mb-4">
            <RiMailSendLine className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            You&apos;ve been invited to {organisation.name}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Invited as <strong>{invitation.role}</strong> to <strong>{invitation.email}</strong>.
          </p>
        </div>

        {!session?.user?.id ? (
          invitedUser ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Sign in to accept this invitation.
              </p>
              <Link href={`/signin?callbackUrl=${acceptHref}`} className="block">
                <Button className="w-full">Sign in to accept</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                You don&apos;t have an Enopax account yet. Create one to accept.
              </p>
              <Link href={`/register?invite=${token}`} className="block">
                <Button className="w-full">Create account &amp; accept</Button>
              </Link>
              <Link href={`/signin?callbackUrl=${acceptHref}`} className="block">
                <Button variant="light" className="w-full">I already have an account</Button>
              </Link>
            </div>
          )
        ) : session.user.email?.toLowerCase() !== invitation.email.toLowerCase() ? (
          <div className="space-y-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-900 dark:text-amber-200">
              You&apos;re signed in as <strong>{session.user.email}</strong>, but this invite is for <strong>{invitation.email}</strong>. Sign out and retry with the right account.
            </div>
            <Link href={`/api/auth/signout?callbackUrl=${acceptHref}`} className="block">
              <Button variant="light" className="w-full">Sign out</Button>
            </Link>
          </div>
        ) : (
          <AcceptInvitationButton token={token} organisationName={organisation.name} />
        )}
      </Card>
    </main>
  );
}

function ErrorCard({
  title,
  message,
  actionLabel,
  actionHref,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="inline-flex p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
          <RiAlertLine className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        {actionLabel && actionHref && (
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        )}
      </Card>
    </main>
  );
}
