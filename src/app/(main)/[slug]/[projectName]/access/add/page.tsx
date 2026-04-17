import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { resolveProjectPermissions } from '@/lib/permissions';
import { RiArrowLeftLine } from '@remixicon/react';
import GrantProjectAccessForm from '@/components/form/GrantProjectAccessForm';

interface AddProjectAccessPageProps {
  params: Promise<{ slug: string; projectName: string }>;
}

export default async function AddProjectAccessPage({ params }: AddProjectAccessPageProps) {
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
  const grantedTeamIds = new Set(accessRows.map((r) => r.teamId));
  const allTeams = await store.teams.findByOrgId(organisation.id);
  const availableTeams = allTeams
    .filter((t) => !grantedTeamIds.has(t.id))
    .map((t) => ({ id: t.id, name: t.name, defaultProjectRole: t.defaultProjectRole }));

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${slug}/${projectName}/access`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Back to project access
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Team Access</h1>
      </div>

      <GrantProjectAccessForm
        projectId={project.id}
        availableTeams={availableTeams}
        organisationName={slug}
        projectName={projectName}
      />
    </div>
  );
}
