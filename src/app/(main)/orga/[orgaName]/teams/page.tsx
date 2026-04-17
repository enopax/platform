import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RiTeamLine, RiAddLine, RiArrowRightLine } from '@remixicon/react';

interface TeamsPageProps {
  params: Promise<{ orgaName: string }>;
}

export default async function TeamsPage({ params }: TeamsPageProps) {
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
  if (!membership && session.user.role !== 'ADMIN') {
    notFound();
  }

  const canManage =
    session.user.role === 'ADMIN' ||
    membership?.role === 'OWNER' ||
    membership?.role === 'ADMIN' ||
    membership?.role === 'MANAGER';

  const teams = await store.teams.findByOrgId(organisation.id);

  const teamsWithCounts = await Promise.all(
    teams.map(async (team) => {
      const members = await store.teamMembers.findByTeamId(team.id);
      return { ...team, memberCount: members.length };
    })
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teams</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage teams and their project access within {orgaName}
          </p>
        </div>
        {canManage && (
          <Link href={`/orga/${orgaName}/teams/new`}>
            <Button>
              <RiAddLine className="w-4 h-4 mr-1" />
              New Team
            </Button>
          </Link>
        )}
      </div>

      {teamsWithCounts.length === 0 ? (
        <Card className="p-12 text-center">
          <RiTeamLine className="mx-auto w-10 h-10 text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">No teams yet</p>
          {canManage && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Create a team to group members and manage project access.
            </p>
          )}
          {canManage && (
            <div className="mt-4">
              <Link href={`/orga/${orgaName}/teams/new`}>
                <Button variant="light">
                  <RiAddLine className="w-4 h-4 mr-1" />
                  Create first team
                </Button>
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {teamsWithCounts.map((team) => (
            <Link key={team.id} href={`/orga/${orgaName}/teams/${team.name}`}>
              <Card className="p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                      <RiTeamLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{team.name}</p>
                      {team.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{team.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default">{team.defaultProjectRole}</Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                    </span>
                    <RiArrowRightLine className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
