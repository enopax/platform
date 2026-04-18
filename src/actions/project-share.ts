'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import type { SharePermission } from '@/lib/store';
import { sendShareInvitationEmail } from '@/lib/share-invitations';

const VALID_PERMISSIONS: SharePermission[] = ['VIEW', 'CONTRIBUTE', 'MANAGE'];

export interface ShareProjectState {
  success?: boolean;
  error?: string;
  fieldErrors?: { slug?: string; permission?: string };
}

export interface UpdateSharePermissionState {
  success?: boolean;
  error?: string;
  fieldErrors?: { permission?: string };
}

export async function shareProject(
  projectId: string,
  prevState: ShareProjectState,
  formData: FormData
): Promise<ShareProjectState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Authentication required' };
    }

    const slug = (formData.get('slug') as string)?.trim();
    const permission = formData.get('permission') as string;

    if (!slug) {
      return {
        error: 'Organisation or user name is required',
        fieldErrors: { slug: 'Organisation or user name is required' },
      };
    }

    if (!permission || !VALID_PERMISSIONS.includes(permission as SharePermission)) {
      return {
        error: 'Permission must be one of VIEW, CONTRIBUTE, MANAGE',
        fieldErrors: { permission: 'Must be VIEW, CONTRIBUTE, or MANAGE' },
      };
    }

    const store = await getStoreAsync();

    const project = await store.projects.findById(projectId);
    if (!project) {
      return { error: 'Project not found' };
    }

    const orgMembership = await store.organisationMembers.findByUserAndOrg(
      session.user.id,
      project.organisationId
    );
    const isOrgAdmin =
      session.user.role === 'ADMIN' ||
      (orgMembership && ['OWNER', 'ADMIN'].includes(orgMembership.role));

    if (!isOrgAdmin) {
      return { error: 'You do not have permission to share this project' };
    }

    let namespace = await store.namespaces.findBySlug(slug);

    if (!namespace) {
      const orgByName = await store.organisations.findByName(slug);
      if (orgByName) {
        namespace = await store.namespaces.findByEntity('ORGANISATION', orgByName.id);
      }
    }

    if (!namespace) {
      return {
        error: 'No user or organisation found with this name',
        fieldErrors: { slug: 'No user or organisation found with this name' },
      };
    }

    if (
      namespace.entityType === 'ORGANISATION' &&
      namespace.entityId === project.organisationId
    ) {
      return {
        error: `You cannot share a project with its own organisation`,
        fieldErrors: { slug: 'Cannot share with the host organisation' },
      };
    }

    const existing = await store.projectShares.findByProjectAndEntity(
      projectId,
      namespace.entityType as 'USER' | 'ORGANISATION',
      namespace.entityId
    );
    if (existing && existing.status !== 'REVOKED' && existing.status !== 'DECLINED') {
      return {
        error: 'This project is already shared with that organisation or user',
        fieldErrors: { slug: 'Already shared with this entity' },
      };
    }

    await store.projectShares.create({
      projectId,
      sharedWithType: namespace.entityType as 'USER' | 'ORGANISATION',
      sharedWithId: namespace.entityId,
      permission: permission as SharePermission,
      sharedBy: session.user.id,
    });

    const hostOrg2 = await store.organisations.findById(project.organisationId);

    if (namespace.entityType === 'ORGANISATION') {
      const collabOrg = await store.organisations.findById(namespace.entityId);
      if (collabOrg) {
        const members = await store.organisationMembers.findByOrgId(collabOrg.id);
        const ownerMember = members.find((m) => m.role === 'OWNER');
        if (ownerMember) {
          const ownerUser = await store.users.findById(ownerMember.userId);
          if (ownerUser) {
            await sendShareInvitationEmail(
              ownerUser.email,
              project.name,
              hostOrg2?.name ?? project.organisationId,
              permission as SharePermission,
              collabOrg.name,
            ).catch(() => {});
          }
        }
      }
    } else {
      const targetUser = await store.users.findById(namespace.entityId);
      if (targetUser) {
        await sendShareInvitationEmail(
          targetUser.email,
          project.name,
          hostOrg2?.name ?? project.organisationId,
          permission as SharePermission,
        ).catch(() => {});
      }
    }

    if (hostOrg2) {
      revalidatePath(`/${hostOrg2.name}/${project.name}/share`);
    }

    return { success: true };
  } catch {
    return { error: 'Failed to share project. Please try again.' };
  }
}

export async function updateSharePermission(
  shareId: string,
  prevState: UpdateSharePermissionState,
  formData: FormData
): Promise<UpdateSharePermissionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Authentication required' };
    }

    const permission = formData.get('permission') as string;

    if (!permission || !VALID_PERMISSIONS.includes(permission as SharePermission)) {
      return {
        error: 'Permission must be one of VIEW, CONTRIBUTE, MANAGE',
        fieldErrors: { permission: 'Must be VIEW, CONTRIBUTE, or MANAGE' },
      };
    }

    const store = await getStoreAsync();

    const share = await store.projectShares.findById(shareId);
    if (!share) {
      return { error: 'Share record not found' };
    }

    const project = await store.projects.findById(share.projectId);
    if (!project) {
      return { error: 'Project not found' };
    }

    const orgMembership = await store.organisationMembers.findByUserAndOrg(
      session.user.id,
      project.organisationId
    );
    const isOrgAdmin =
      session.user.role === 'ADMIN' ||
      (orgMembership && ['OWNER', 'ADMIN'].includes(orgMembership.role));

    if (!isOrgAdmin) {
      return { error: 'You do not have permission to update this share' };
    }

    await store.projectShares.updatePermission(shareId, permission as SharePermission);

    const org = await store.organisations.findById(project.organisationId);
    if (org) {
      revalidatePath(`/${org.name}/${project.name}/share`);
    }

    return { success: true };
  } catch {
    return { error: 'Failed to update share permission. Please try again.' };
  }
}

export async function revokeShare(
  shareId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const store = await getStoreAsync();

    const share = await store.projectShares.findById(shareId);
    if (!share) {
      return { success: false, error: 'Share record not found' };
    }

    const project = await store.projects.findById(share.projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const orgMembership = await store.organisationMembers.findByUserAndOrg(
      session.user.id,
      project.organisationId
    );
    const isOrgAdmin =
      session.user.role === 'ADMIN' ||
      (orgMembership && ['OWNER', 'ADMIN'].includes(orgMembership.role));

    if (!isOrgAdmin) {
      return { success: false, error: 'You do not have permission to revoke this share' };
    }

    await store.projectShares.revoke(shareId);

    const org = await store.organisations.findById(project.organisationId);
    if (org) {
      revalidatePath(`/${org.name}/${project.name}/share`);
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to revoke share. Please try again.' };
  }
}

export async function acceptShare(
  shareId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const store = await getStoreAsync();

    const share = await store.projectShares.findById(shareId);
    if (!share) {
      return { success: false, error: 'Share invitation not found' };
    }

    if (share.status !== 'INVITED') {
      return { success: false, error: 'This invitation is no longer pending' };
    }

    if (share.sharedWithType === 'ORGANISATION') {
      const membership = await store.organisationMembers.findByUserAndOrg(
        session.user.id,
        share.sharedWithId
      );
      const isOrgAdmin =
        session.user.role === 'ADMIN' ||
        (membership && ['OWNER', 'ADMIN'].includes(membership.role));
      if (!isOrgAdmin) {
        return { success: false, error: 'You do not have permission to accept this invitation' };
      }
    } else if (share.sharedWithType === 'USER') {
      if (session.user.id !== share.sharedWithId && session.user.role !== 'ADMIN') {
        return { success: false, error: 'You do not have permission to accept this invitation' };
      }
    }

    await store.projectShares.updateStatus(shareId, 'ACTIVE');

    revalidatePath(`/${session.user.id}/invitations`);

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to accept invitation. Please try again.' };
  }
}

export async function declineShare(
  shareId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const store = await getStoreAsync();

    const share = await store.projectShares.findById(shareId);
    if (!share) {
      return { success: false, error: 'Share invitation not found' };
    }

    if (share.status !== 'INVITED') {
      return { success: false, error: 'This invitation is no longer pending' };
    }

    if (share.sharedWithType === 'ORGANISATION') {
      const membership = await store.organisationMembers.findByUserAndOrg(
        session.user.id,
        share.sharedWithId
      );
      const isOrgAdmin =
        session.user.role === 'ADMIN' ||
        (membership && ['OWNER', 'ADMIN'].includes(membership.role));
      if (!isOrgAdmin) {
        return { success: false, error: 'You do not have permission to decline this invitation' };
      }
    } else if (share.sharedWithType === 'USER') {
      if (session.user.id !== share.sharedWithId && session.user.role !== 'ADMIN') {
        return { success: false, error: 'You do not have permission to decline this invitation' };
      }
    }

    await store.projectShares.updateStatus(shareId, 'DECLINED');

    revalidatePath(`/${session.user.id}/invitations`);

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to decline invitation. Please try again.' };
  }
}
