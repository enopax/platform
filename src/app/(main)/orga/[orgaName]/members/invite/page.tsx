import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import InviteMemberForm from '@/components/form/InviteMemberForm';
import { RiArrowLeftLine } from '@remixicon/react';

interface InviteMemberPageProps {
  params: Promise<{ orgaName: string }>;
}

export default async function InviteMemberPage({ params }: InviteMemberPageProps) {
  const { orgaName } = await params;
  const session = await auth();

  if (!session?.user?.id) notFound();
  if (!orgaName) notFound();

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(orgaName);
  if (!organisation) notFound();

  const isAdmin = session.user.role === 'ADMIN';
  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisation.id);

  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';

  if (!isAdmin && !isOwner && !isManager) notFound();

  return (
    <main className="mt-4">
      <Container>
        <div className="mb-6">
          <Link
            href={`/orga/${orgaName}/members`}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3"
          >
            <RiArrowLeftLine className="h-4 w-4 mr-1" />
            Back to members
          </Link>
          <Headline>Invite Member</Headline>
        </div>

        <div className="max-w-xl">
          <InviteMemberForm organisationId={organisation.id} organisationName={organisation.name} />
        </div>
      </Container>
    </main>
  );
}
