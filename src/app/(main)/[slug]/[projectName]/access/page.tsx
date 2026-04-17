import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { resolveProjectPermissions } from '@/lib/permissions';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { RiAddLine, RiTeamLine, RiInformationLine, RiShareLine } from '@remixicon/react';
import RevokeAccessButton from '@/components/team/RevokeAccessButton';
import ChangeAccessRoleForm from '@/components/team/ChangeAccessRoleForm';

interface ProjectAccessPageProps {
  params: Promise<{ slug: string; projectName: string }>;
}

export default async function ProjectAccessPage({ params }: ProjectAccessPageProps) {
  const { slug, projectName } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(slug);
  if (!organisation) notFound();

  const project = await store.projects.findByNameAndOrg(projectName, organisation.id);
  if (!project) notFound();

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisation.id);
  const isOrgAdmin =
    session.user.role === 'ADMIN' ||
    membership?.role === 'OWNER' ||
    membership?.role === 'ADMIN';

  if (!isOrgAdmin) {
    const projectRole = await resolveProjectPermissions(session.user.id, project.id);
    if (projectRole !== 'ADMIN') {
      notFound();
    }
  }

  const accessRows = await store.projectAccess.findByProjectId(project.id);

  const accessWithTeams = await Promise.all(
    accessRows.map(async (row) => {
      const team = await store.teams.findById(row.teamId);
      const members = team ? await store.teamMembers.findByTeamId(team.id) : [];
      return {
        ...row,
        teamName: team?.name ?? 'Unknown team',
        memberCount: members.length,
      };
    })
  );

  const grantedTeamIds = new Set(accessRows.map((r) => r.teamId));
  const allTeams = await store.teams.findByOrgId(organisation.id);
  const availableTeams = allTeams.filter((t) => !grantedTeamIds.has(t.id));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Access</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage which teams can access {projectName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${slug}/${projectName}/share`}>
            <Button variant="light">
              <RiShareLine className="w-4 h-4 mr-1" />
              Share with external
            </Button>
          </Link>
          {availableTeams.length > 0 && (
            <Link href={`/${slug}/${projectName}/access/add`}>
              <Button>
                <RiAddLine className="w-4 h-4 mr-1" />
                Add Team
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Callout variant="default" title="Inherited access" icon={RiInformationLine} className="mb-6">
        Organisation OWNERs and ADMINs automatically have ADMIN access to all projects.
      </Callout>

      {accessWithTeams.length === 0 ? (
        <Card className="p-12 text-center">
          <RiTeamLine className="mx-auto w-10 h-10 text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">No teams have been granted access yet</p>
          {availableTeams.length > 0 && (
            <div className="mt-4">
              <Link href={`/${slug}/${projectName}/access/add`}>
                <Button variant="light">
                  <RiAddLine className="w-4 h-4 mr-1" />
                  Add first team
                </Button>
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {accessWithTeams.map((row) => (
              <li key={row.id} className="flex items-center justify-between px-6 py-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                    <RiTeamLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <Link
                      href={`/${slug}/teams/${row.teamName}`}
                      className="font-semibold text-gray-900 dark:text-white hover:underline"
                    >
                      {row.teamName}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {row.memberCount} {row.memberCount === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">{row.role}</Badge>
                  <ChangeAccessRoleForm accessId={row.id} currentRole={row.role} />
                  <RevokeAccessButton accessId={row.id} teamName={row.teamName} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
