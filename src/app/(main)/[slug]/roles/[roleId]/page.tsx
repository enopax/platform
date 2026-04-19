import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { updateProjectRole } from '@/actions/project-role';
import { RoleForm } from '@/components/role/RoleForm';
import { DeleteRoleButton } from '@/components/role/DeleteRoleButton';
import { Badge } from '@/components/common/Badge';
import { RiArrowLeftLine, RiShieldLine } from '@remixicon/react';

interface EditRolePageProps {
  params: Promise<{ slug: string; roleId: string }>;
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  const { slug, roleId } = await params;
  const session = await auth();

  if (!session?.user?.id) notFound();
  if (!slug || !roleId) notFound();

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(slug);
  if (!organisation) notFound();

  const role = await store.projectRoles.findById(roleId);
  if (!role || role.organisationId !== organisation.id) notFound();

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisation.id);

  const canManage =
    membership?.role === 'OWNER' ||
    membership?.role === 'ADMIN';

  if (!canManage) notFound();

  const boundAction = updateProjectRole.bind(null, roleId);

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
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{role.name}</h1>
          {role.isBuiltIn && (
            <Badge variant="default">
              <RiShieldLine className="w-3 h-3 mr-1" />
              Built-in
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-xl space-y-6">
        <RoleForm
          organisationName={slug}
          organisationId={organisation.id}
          role={role}
          action={boundAction}
        />

        {!role.isBuiltIn && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Danger zone</h3>
            <DeleteRoleButton
              roleId={role.id}
              roleName={role.name}
              organisationName={slug}
            />
          </div>
        )}
      </div>
    </div>
  );
}
