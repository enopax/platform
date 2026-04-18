'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import type { ProjectPermission } from '@/lib/store';

export interface RoleState {
  success?: boolean;
  error?: string;
  fieldErrors?: { name?: string; description?: string };
}

const ALL_PERMISSIONS: ProjectPermission[] = [
  'project:view',
  'project:settings',
  'resource:view',
  'resource:create',
  'resource:edit',
  'resource:delete',
  'resource:deploy',
  'access:view',
  'access:manage',
];

async function requireOrgAdminAccess(organisationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Authentication required' as const };
  }

  const store = await getStoreAsync();
  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisationId);

  const isOrgAdmin = session.user.role === 'ADMIN';
  const isOwnerOrAdmin = membership?.role === 'OWNER' || membership?.role === 'ADMIN';

  if (!isOrgAdmin && !isOwnerOrAdmin) {
    return { error: 'You do not have permission to manage roles in this organisation' as const };
  }

  return { store, session };
}

function parsePermissions(formData: FormData): ProjectPermission[] {
  const raw = formData.get('permissions') as string | null;
  if (raw) {
    return raw
      .split(',')
      .map((p) => p.trim())
      .filter((p): p is ProjectPermission => ALL_PERMISSIONS.includes(p as ProjectPermission));
  }
  return ALL_PERMISSIONS.filter((p) => formData.get(`perm_${p}`) === 'on');
}

export async function createProjectRole(
  organisationId: string,
  prevState: RoleState,
  formData: FormData
): Promise<RoleState> {
  try {
    const access = await requireOrgAdminAccess(organisationId);
    if ('error' in access) return { error: access.error };

    const { store } = access;
    const name = (formData.get('name') as string | null)?.trim() ?? '';
    const description = (formData.get('description') as string | null)?.trim() ?? '';
    const rankRaw = formData.get('rank') as string | null;
    const rank = rankRaw ? parseInt(rankRaw, 10) : 10;

    if (!name || name.length < 2) {
      return {
        error: 'Name must be at least 2 characters',
        fieldErrors: { name: 'Name must be at least 2 characters' },
      };
    }

    const existing = await store.projectRoles.findByNameAndOrg(name, organisationId);
    if (existing) {
      return {
        error: 'A role with this name already exists in the organisation',
        fieldErrors: { name: 'A role with this name already exists' },
      };
    }

    const permissions = parsePermissions(formData);

    await store.projectRoles.create({
      organisationId,
      name,
      description,
      permissions,
      isBuiltIn: false,
      rank: isNaN(rank) ? 10 : rank,
    });

    revalidatePath('/[slug]/roles', 'page');

    return { success: true };
  } catch {
    return { error: 'Failed to create role. Please try again.' };
  }
}

export async function updateProjectRole(
  roleId: string,
  prevState: RoleState,
  formData: FormData
): Promise<RoleState> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Authentication required' };

    const store = await getStoreAsync();
    const role = await store.projectRoles.findById(roleId);
    if (!role) return { error: 'Role not found' };

    const access = await requireOrgAdminAccess(role.organisationId);
    if ('error' in access) return { error: access.error };

    const description = (formData.get('description') as string | null)?.trim() ?? '';
    const rankRaw = formData.get('rank') as string | null;
    const rank = rankRaw ? parseInt(rankRaw, 10) : role.rank;
    const permissions = parsePermissions(formData);

    const updates: { name?: string; description?: string; permissions?: ProjectPermission[]; rank?: number } = {
      description,
      permissions,
      rank: isNaN(rank) ? role.rank : rank,
    };

    if (!role.isBuiltIn) {
      const name = (formData.get('name') as string | null)?.trim() ?? '';
      if (!name || name.length < 2) {
        return {
          error: 'Name must be at least 2 characters',
          fieldErrors: { name: 'Name must be at least 2 characters' },
        };
      }
      const conflicting = await store.projectRoles.findByNameAndOrg(name, role.organisationId);
      if (conflicting && conflicting.id !== roleId) {
        return {
          error: 'A role with this name already exists in the organisation',
          fieldErrors: { name: 'A role with this name already exists' },
        };
      }
      updates.name = name;
    }

    await store.projectRoles.update(roleId, updates);

    revalidatePath('/[slug]/roles', 'page');

    return { success: true };
  } catch {
    return { error: 'Failed to update role. Please try again.' };
  }
}

export async function deleteProjectRole(
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Authentication required' };

    const store = await getStoreAsync();
    const role = await store.projectRoles.findById(roleId);
    if (!role) return { success: false, error: 'Role not found' };

    const access = await requireOrgAdminAccess(role.organisationId);
    if ('error' in access) return { success: false, error: access.error };

    const projects = await store.projects.findByOrgId(role.organisationId);
    let usageCount = 0;

    for (const project of projects) {
      const accesses = await store.projectAccess.findByProjectId(project.id);
      usageCount += accesses.filter((a) => a.role === role.name).length;
    }

    if (usageCount > 0) {
      return {
        success: false,
        error: `Role is in use by ${usageCount} project${usageCount === 1 ? '' : 's'}`,
      };
    }

    await store.projectRoles.delete(roleId);

    revalidatePath('/[slug]/roles', 'page');

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete role. Please try again.';
    return { success: false, error: message };
  }
}
