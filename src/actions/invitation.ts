'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import type { OrganisationRole } from '@/lib/store';
import { createInvitationToken, sendInvitationEmail } from '@/lib/invitations';

export interface InviteMemberState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    email?: string;
    role?: string;
  };
}

const VALID_ROLES: OrganisationRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'];

export async function inviteMember(
  organisationId: string,
  _prevState: InviteMemberState,
  formData: FormData,
): Promise<InviteMemberState> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const role = formData.get('role') as OrganisationRole;

  const fieldErrors: InviteMemberState['fieldErrors'] = {};
  if (!email || !email.includes('@')) fieldErrors.email = 'Valid email required';
  if (!role || !VALID_ROLES.includes(role)) fieldErrors.role = 'Select a role';
  if (Object.keys(fieldErrors).length > 0) return { error: 'Please fix the errors below', fieldErrors };

  const store = await getStoreAsync();

  const organisation = await store.organisations.findById(organisationId);
  if (!organisation) return { error: 'Organisation not found' };

  const inviterMembership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisationId);
  const isAdmin = session.user.role === 'ADMIN';
  if (!isAdmin && !inviterMembership) return { error: 'Not authorised' };
  if (!isAdmin && inviterMembership && !['OWNER', 'MANAGER'].includes(inviterMembership.role)) {
    return { error: 'Only owners and managers can invite members' };
  }

  const existingUser = await store.users.findByEmail(email);
  if (existingUser) {
    const existingMember = await store.organisationMembers.findByUserAndOrg(existingUser.id, organisationId);
    if (existingMember) {
      return { error: 'This user is already a member of the organisation', fieldErrors: { email: 'Already a member' } };
    }
  }

  try {
    const { token } = await createInvitationToken(email, organisationId, role, session.user.id);

    const inviter = await store.users.findById(session.user.id);
    const inviterName = inviter?.name || inviter?.email || 'An Enopax admin';

    await sendInvitationEmail(email, token, organisation.name, inviterName, role);

    revalidatePath(`/orga/${organisation.name}/members`);
    return { success: true };
  } catch (e: unknown) {
    console.error('Invitation error:', e);
    return { error: 'Failed to send invitation. Please try again.' };
  }
}

export async function acceptInvitation(token: string): Promise<{ success: boolean; error?: string; organisationName?: string }> {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return { success: false, error: 'You must be signed in to accept an invitation.' };
  }

  const store = await getStoreAsync();
  const invitation = await store.invitations.findByToken(token);
  if (!invitation) return { success: false, error: 'Invitation not found.' };

  if (invitation.status !== 'PENDING') {
    return { success: false, error: `This invitation has already been ${invitation.status.toLowerCase()}.` };
  }
  if (invitation.expiresAt < new Date()) {
    await store.invitations.update(invitation.id, { status: 'EXPIRED' });
    return { success: false, error: 'This invitation has expired. Ask the admin to send a new one.' };
  }

  const sessionEmail = session.user.email.toLowerCase();
  if (invitation.email.toLowerCase() !== sessionEmail) {
    return { success: false, error: `This invitation is for ${invitation.email}, not ${sessionEmail}.` };
  }

  const existingMember = await store.organisationMembers.findByUserAndOrg(session.user.id, invitation.organisationId);
  if (existingMember) {
    await store.invitations.update(invitation.id, {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      acceptedByUserId: session.user.id,
    });
    const organisation = await store.organisations.findById(invitation.organisationId);
    return { success: true, organisationName: organisation?.name };
  }

  await store.organisationMembers.create({
    userId: session.user.id,
    organisationId: invitation.organisationId,
    role: invitation.role,
  });

  await store.invitations.update(invitation.id, {
    status: 'ACCEPTED',
    acceptedAt: new Date(),
    acceptedByUserId: session.user.id,
  });

  const organisation = await store.organisations.findById(invitation.organisationId);
  if (organisation) revalidatePath(`/orga/${organisation.name}/members`);

  return { success: true, organisationName: organisation?.name };
}

export async function revokeInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' };

  const store = await getStoreAsync();
  const invitation = await store.invitations.findById(invitationId);
  if (!invitation) return { success: false, error: 'Invitation not found' };

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, invitation.organisationId);
  const isAdmin = session.user.role === 'ADMIN';
  if (!isAdmin && (!membership || !['OWNER', 'MANAGER'].includes(membership.role))) {
    return { success: false, error: 'Not authorised' };
  }

  await store.invitations.update(invitationId, { status: 'REVOKED' });

  const organisation = await store.organisations.findById(invitation.organisationId);
  if (organisation) revalidatePath(`/orga/${organisation.name}/members`);

  return { success: true };
}
