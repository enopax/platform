import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { createProjectRole } from '@/actions/project-role';
import { RoleForm } from '@/components/role/RoleForm';
import { RiArrowLeftLine } from '@remixicon/react';

interface NewRolePageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewRolePage({ params }: NewRolePageProps) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) notFound();
  if (!slug) notFound();

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(slug);
  if (!organisation) notFound();

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisation.id);

  const canManage =
    membership?.role === 'OWNER' ||
    membership?.role === 'ADMIN';

  if (!canManage) notFound();

  const boundAction = createProjectRole.bind(null, organisation.id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${slug}/roles`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Back to roles
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Role</h1>
      </div>

      <div className="max-w-xl">
        <RoleForm
          organisationName={slug}
          organisationId={organisation.id}
          action={boundAction}
        />
      </div>
    </div>
  );
}
