import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { seedBuiltInRoles } from '@/lib/seed-roles';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { PermissionGrid } from '@/components/role/PermissionGrid';
import { DeleteRoleButton } from '@/components/role/DeleteRoleButton';
import { RiAddLine, RiEditLine, RiShieldLine } from '@remixicon/react';

interface RolesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RolesPage({ params }: RolesPageProps) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) notFound();
  if (!slug) notFound();

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(slug);
  if (!organisation) notFound();

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisation.id);
  if (!membership) notFound();

  const canManage =
    membership.role === 'OWNER' ||
    membership.role === 'ADMIN';

  let roles = await store.projectRoles.findByOrgId(organisation.id);

  if (roles.length === 0) {
    await seedBuiltInRoles(organisation.id);
    roles = await store.projectRoles.findByOrgId(organisation.id);
  }

  roles.sort((a, b) => a.rank - b.rank);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Project role definitions for {organisation.name}
          </p>
        </div>
        {canManage && (
          <Link href={`/${slug}/roles/new`}>
            <Button variant="primary">
              <RiAddLine className="w-4 h-4 mr-1" />
              New role
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <Card key={role.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {role.name}
                  </h3>
                  {role.isBuiltIn && (
                    <Badge variant="default">
                      <RiShieldLine className="w-3 h-3 mr-1" />
                      Built-in
                    </Badge>
                  )}
                  <Badge variant="default">Rank {role.rank}</Badge>
                </div>
                {role.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {role.description}
                  </p>
                )}
                <PermissionGrid permissions={role.permissions} readOnly />
              </div>

              {canManage && (
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/${slug}/roles/${role.id}`}>
                    <Button variant="light" className="gap-1">
                      <RiEditLine className="w-4 h-4" />
                      Edit
                    </Button>
                  </Link>
                  {!role.isBuiltIn && (
                    <DeleteRoleButton
                      roleId={role.id}
                      roleName={role.name}
                      organisationName={slug}
                    />
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
