import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { RiArrowLeftLine } from '@remixicon/react';
import CreateTeamForm from '@/components/form/CreateTeamForm';

interface NewTeamPageProps {
  params: Promise<{ orgaName: string }>;
}

export default async function NewTeamPage({ params }: NewTeamPageProps) {
  const { orgaName } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  if (!orgaName) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(orgaName);
  if (!organisation) notFound();

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisation.id);

  const canManage =
    session.user.role === 'SUPERADMIN' ||
    membership?.role === 'OWNER' ||
    membership?.role === 'ADMIN' ||
    membership?.role === 'MANAGER';

  if (!canManage) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/orga/${orgaName}/teams`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Back to teams
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Team</h1>
      </div>

      <div className="max-w-xl">
        <CreateTeamForm organisationId={organisation.id} organisationName={orgaName} />
      </div>
    </div>
  );
}
