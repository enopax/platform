import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RiArrowLeftLine, RiAddLine, RiUserLine } from '@remixicon/react';
import DeleteTeamButton from '@/components/team/DeleteTeamButton';
import RemoveTeamMemberButton from '@/components/team/RemoveTeamMemberButton';

interface TeamDetailPageProps {
  params: Promise<{ slug: string; teamName: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { slug, teamName } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(slug);
  if (!organisation) notFound();

  const team = await store.teams.findByNameAndOrg(teamName, organisation.id);
  if (!team) notFound();

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisation.id);
  if (!membership && session.user.role !== 'ADMIN') {
    notFound();
  }

  const canManage =
    session.user.role === 'ADMIN' ||
    membership?.role === 'OWNER' ||
    membership?.role === 'ADMIN' ||
    membership?.role === 'MANAGER';

  const canDelete =
    session.user.role === 'ADMIN' ||
    membership?.role === 'OWNER' ||
    membership?.role === 'ADMIN';

  const rawMembers = await store.teamMembers.findByTeamId(team.id);
  const members = await Promise.all(
    rawMembers.map(async (m) => {
      const user = await store.users.findById(m.userId);
      return {
        ...m,
        user: {
          id: m.userId,
          name: user?.name ?? null,
          firstname: user?.firstname ?? null,
          lastname: user?.lastname ?? null,
          email: user?.email ?? '',
        },
      };
    })
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${slug}/teams`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Back to teams
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
              <Badge variant="default">{team.defaultProjectRole}</Badge>
            </div>
            {team.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{team.description}</p>
            )}
          </div>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Members ({members.length})
          </h2>
          {canManage && (
            <Link href={`/${slug}/teams/${teamName}/add-member`}>
              <Button variant="light">
                <RiAddLine className="w-4 h-4 mr-1" />
                Add member
              </Button>
            </Link>
          )}
        </div>

        {members.length === 0 ? (
          <div className="p-12 text-center">
            <RiUserLine className="mx-auto w-8 h-8 text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No members in this team yet.</p>
            {canManage && (
              <div className="mt-4">
                <Link href={`/${slug}/teams/${teamName}/add-member`}>
                  <Button variant="light">
                    <RiAddLine className="w-4 h-4 mr-1" />
                    Add first member
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((m) => {
              const displayName = m.user.name
                ?? ([m.user.firstname, m.user.lastname].filter(Boolean).join(' ') || m.user.email);
              return (
                <li key={m.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{m.user.email}</p>
                    </div>
                  </div>
                  {canManage && (
                    <RemoveTeamMemberButton
                      teamId={team.id}
                      userId={m.userId}
                      displayName={displayName}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {canDelete && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Danger zone</h3>
          <DeleteTeamButton
            teamId={team.id}
            teamName={team.name}
            organisationName={slug}
          />
        </div>
      )}
    </div>
  );
}
