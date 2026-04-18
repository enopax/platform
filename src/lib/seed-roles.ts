import type { ProjectPermission } from '@/lib/store';
import { getStoreAsync } from '@/lib/store';

const BUILT_IN_ROLES = [
  {
    name: 'Viewer',
    description: 'Read project metadata and view resources',
    permissions: ['project:view', 'resource:view', 'access:view'] as ProjectPermission[],
    rank: 0,
  },
  {
    name: 'Developer',
    description: 'Create, edit, and delete resources',
    permissions: ['project:view', 'resource:view', 'resource:create', 'resource:edit', 'resource:delete', 'access:view'] as ProjectPermission[],
    rank: 1,
  },
  {
    name: 'Deployer',
    description: 'Deploy and provision resources',
    permissions: ['project:view', 'resource:view', 'resource:create', 'resource:edit', 'resource:delete', 'resource:deploy', 'access:view'] as ProjectPermission[],
    rank: 2,
  },
  {
    name: 'Admin',
    description: 'Full project control including access management',
    permissions: ['project:view', 'project:settings', 'resource:view', 'resource:create', 'resource:edit', 'resource:delete', 'resource:deploy', 'access:view', 'access:manage'] as ProjectPermission[],
    rank: 3,
  },
];

export async function seedBuiltInRoles(organisationId: string): Promise<void> {
  const store = await getStoreAsync();

  for (const role of BUILT_IN_ROLES) {
    const existing = await store.projectRoles.findByNameAndOrg(role.name, organisationId);
    if (!existing) {
      await store.projectRoles.create({
        ...role,
        organisationId,
        isBuiltIn: true,
      });
    }
  }
}
