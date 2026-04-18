import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { Card } from '@/components/common/Card';
import { Callout } from '@/components/common/Callout';
import { RiArrowRightLine, RiErrorWarningLine } from '@remixicon/react';
import TransferProjectForm from '@/components/project/TransferProjectForm';

interface TransferProjectPageProps {
  params: Promise<{ slug: string; projectName: string }>;
}

export default async function TransferProjectPage({ params }: TransferProjectPageProps) {
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
  const isOwner =
    session.user.role === 'ADMIN' ||
    (membership && membership.role === 'OWNER');

  if (!isOwner) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transfer Project</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Move {projectName} to another organisation
        </p>
      </div>

      <Callout variant="warning" title="This action cannot be undone" icon={RiErrorWarningLine} className="mb-6">
        Transferring this project will remove all existing team access and cross-organisation shares.
        The receiving organisation will take full ownership. You will lose access unless you are also
        a member of the target organisation.
      </Callout>

      <Card className="max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">{organisation.name}</span>
          <RiArrowRightLine className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">target organisation</span>
        </div>
        <div className="p-6">
          <TransferProjectForm
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </Card>
    </div>
  );
}
