import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { RiArrowLeftLine } from '@remixicon/react';
import AddTeamMemberForm from '@/components/form/AddTeamMemberForm';

interface AddMemberPageProps {
  params: Promise<{ orgaName: string; teamName: string }>;
}

export default async function AddMemberPage({ params }: AddMemberPageProps) {
  const { orgaName, teamName } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(orgaName);
  if (!organisation) notFound();

  const team = await store.teams.findByNameAndOrg(teamName, organisation.id);
  if (!team) notFound();

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisation.id);

  const canManage =
    session.user.role === 'SUPERADMIN' ||
    membership?.role === 'OWNER' ||
    membership?.role === 'ADMIN' ||
    membership?.role === 'MANAGER';

  if (!canManage) {
    notFound();
  }

  const orgMembers = await store.organisationMembers.findByOrgId(organisation.id);
  const currentTeamMembers = await store.teamMembers.findByTeamId(team.id);
  const currentTeamMemberIds = new Set(currentTeamMembers.map((m) => m.userId));

  const availableMembers = await Promise.all(
    orgMembers
      .filter((m) => !currentTeamMemberIds.has(m.userId))
      .map(async (m) => {
        const user = await store.users.findById(m.userId);
        return {
          id: m.userId,
          name: user?.name ?? ([user?.firstname, user?.lastname].filter(Boolean).join(' ') || null),
          email: user?.email ?? '',
        };
      })
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/orga/${orgaName}/teams/${teamName}`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Back to {teamName}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add member</h1>
      </div>

      <div className="max-w-xl">
        <AddTeamMemberForm
          teamId={team.id}
          organisationName={orgaName}
          teamName={teamName}
          availableMembers={availableMembers}
        />
      </div>
    </div>
  );
}
