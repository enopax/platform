'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import type { ProjectRole } from '@/lib/store';
import { validateNameFormat } from '@/lib/name-validation';
import { resolveProjectPermissions } from '@/lib/permissions';

const VALID_PROJECT_ROLES: ProjectRole[] = ['VIEWER', 'DEVELOPER', 'DEPLOYER', 'ADMIN'];

export interface CreateTeamState {
  success?: boolean;
  error?: string;
  teamName?: string;
  fieldErrors?: { name?: string; defaultProjectRole?: string };
}

export interface UpdateTeamState {
  success?: boolean;
  error?: string;
  fieldErrors?: { name?: string; defaultProjectRole?: string };
}

export interface AddTeamMemberState {
  success?: boolean;
  error?: string;
  fieldErrors?: { userId?: string };
}

export interface GrantAccessState {
  success?: boolean;
  error?: string;
  fieldErrors?: { teamId?: string; role?: string };
}

export interface UpdateProjectAccessRoleState {
  success?: boolean;
  error?: string;
  fieldErrors?: { role?: string };
}

export async function createTeam(
  organisationId: string,
  prevState: CreateTeamState,
  formData: FormData
): Promise<CreateTeamState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const defaultProjectRole = formData.get('defaultProjectRole') as string;

    if (!name || name.trim().length < 2) {
      return {
        error: 'Name must be at least 2 characters',
        fieldErrors: { name: 'Name must be at least 2 characters' },
      };
    }

    const nameValidation = validateNameFormat(name.trim());
    if (!nameValidation.isValid) {
      return {
        error: nameValidation.error || 'Invalid team name',
        fieldErrors: { name: nameValidation.error || 'Invalid team name' },
      };
    }

    if (!defaultProjectRole || !VALID_PROJECT_ROLES.includes(defaultProjectRole as ProjectRole)) {
      return {
        error: 'Default project role must be one of VIEWER, DEVELOPER, DEPLOYER, ADMIN',
        fieldErrors: { defaultProjectRole: 'Must be VIEWER, DEVELOPER, DEPLOYER, or ADMIN' },
      };
    }

    const store = await getStoreAsync();

    const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisationId);
    if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return { error: 'You do not have permission to create teams in this organisation' };
    }

    const existing = await store.teams.findByNameAndOrg(name.trim(), organisationId);
    if (existing) {
      return {
        error: 'A team with this name already exists in the organisation',
        fieldErrors: { name: 'A team with this name already exists' },
      };
    }

    const team = await store.teams.create({
      organisationId,
      name: name.trim(),
      description: description?.trim() || undefined,
      defaultProjectRole: defaultProjectRole as ProjectRole,
    });

    revalidatePath(`/orga`);

    return { success: true, teamName: team.name };
  } catch (error) {
    return { error: 'Failed to create team. Please try again.' };
  }
}

export async function updateTeam(
  teamId: string,
  prevState: UpdateTeamState,
  formData: FormData
): Promise<UpdateTeamState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const defaultProjectRole = formData.get('defaultProjectRole') as string;

    if (!name || name.trim().length < 2) {
      return {
        error: 'Name must be at least 2 characters',
        fieldErrors: { name: 'Name must be at least 2 characters' },
      };
    }

    const nameValidation = validateNameFormat(name.trim());
    if (!nameValidation.isValid) {
      return {
        error: nameValidation.error || 'Invalid team name',
        fieldErrors: { name: nameValidation.error || 'Invalid team name' },
      };
    }

    if (!defaultProjectRole || !VALID_PROJECT_ROLES.includes(defaultProjectRole as ProjectRole)) {
      return {
        error: 'Default project role must be one of VIEWER, DEVELOPER, DEPLOYER, ADMIN',
        fieldErrors: { defaultProjectRole: 'Must be VIEWER, DEVELOPER, DEPLOYER, or ADMIN' },
      };
    }

    const store = await getStoreAsync();

    const team = await store.teams.findById(teamId);
    if (!team) {
      return { error: 'Team not found' };
    }

    const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, team.organisationId);
    if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return { error: 'You do not have permission to update this team' };
    }

    const existing = await store.teams.findByNameAndOrg(name.trim(), team.organisationId);
    if (existing && existing.id !== teamId) {
      return {
        error: 'A team with this name already exists in the organisation',
        fieldErrors: { name: 'A team with this name already exists' },
      };
    }

    await store.teams.update(teamId, {
      name: name.trim(),
      description: description?.trim() || undefined,
      defaultProjectRole: defaultProjectRole as ProjectRole,
    });

    revalidatePath(`/orga`);

    return { success: true };
  } catch (error) {
    return { error: 'Failed to update team. Please try again.' };
  }
}

export async function deleteTeam(
  teamId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    const store = await getStoreAsync();

    const team = await store.teams.findById(teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, team.organisationId);
    if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return { success: false, error: 'You do not have permission to delete this team' };
    }

    await store.teamMembers.removeAllForTeam(teamId);
    await store.projectAccess.revokeAllForTeam(teamId);
    await store.teams.delete(teamId);

    revalidatePath(`/orga`);

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete team. Please try again.' };
  }
}

export async function addTeamMember(
  teamId: string,
  prevState: AddTeamMemberState,
  formData: FormData
): Promise<AddTeamMemberState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        error: 'User is required',
        fieldErrors: { userId: 'User is required' },
      };
    }

    const store = await getStoreAsync();

    const team = await store.teams.findById(teamId);
    if (!team) {
      return { error: 'Team not found' };
    }

    const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, team.organisationId);
    if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return { error: 'You do not have permission to manage team members' };
    }

    const userOrgMembership = await store.organisationMembers.findByUserAndOrg(userId, team.organisationId);
    if (!userOrgMembership) {
      return {
        error: 'User is not a member of this organisation',
        fieldErrors: { userId: 'User is not a member of this organisation' },
      };
    }

    await store.teamMembers.add({
      teamId,
      userId,
      addedBy: session.user.id,
    });

    revalidatePath(`/orga`);

    return { success: true };
  } catch (error) {
    return { error: 'Failed to add team member. Please try again.' };
  }
}

export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    const store = await getStoreAsync();

    const team = await store.teams.findById(teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, team.organisationId);
    if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return { success: false, error: 'You do not have permission to manage team members' };
    }

    await store.teamMembers.remove(teamId, userId);

    revalidatePath(`/orga`);

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to remove team member. Please try again.' };
  }
}

export async function grantProjectAccess(
  projectId: string,
  prevState: GrantAccessState,
  formData: FormData
): Promise<GrantAccessState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    const teamId = formData.get('teamId') as string;
    const role = formData.get('role') as string;

    if (!teamId) {
      return {
        error: 'Team is required',
        fieldErrors: { teamId: 'Team is required' },
      };
    }

    if (!role || !VALID_PROJECT_ROLES.includes(role as ProjectRole)) {
      return {
        error: 'Role must be one of VIEWER, DEVELOPER, DEPLOYER, ADMIN',
        fieldErrors: { role: 'Must be VIEWER, DEVELOPER, DEPLOYER, or ADMIN' },
      };
    }

    const store = await getStoreAsync();

    const project = await store.projects.findById(projectId);
    if (!project) {
      return { error: 'Project not found' };
    }

    const team = await store.teams.findById(teamId);
    if (!team) {
      return { error: 'Team not found', fieldErrors: { teamId: 'Team not found' } };
    }

    if (team.organisationId !== project.organisationId) {
      const share = await store.projectShares.findByProjectAndEntity(
        projectId,
        'ORGANISATION',
        team.organisationId
      );
      if (!share || (share.permission !== 'CONTRIBUTE' && share.permission !== 'MANAGE')) {
        return {
          error: 'Team does not belong to the same organisation as the project',
          fieldErrors: { teamId: 'Team must belong to the same organisation or a collaborating organisation' },
        };
      }
    }

    const orgMembership = await store.organisationMembers.findByUserAndOrg(session.user.id, project.organisationId);
    const isOrgAdmin = orgMembership && ['OWNER', 'ADMIN'].includes(orgMembership.role);

    if (!isOrgAdmin) {
      const projectRole = await resolveProjectPermissions(session.user.id, projectId);
      if (projectRole !== 'ADMIN') {
        return { error: 'You do not have permission to grant access to this project' };
      }
    }

    await store.projectAccess.grant({
      projectId,
      teamId,
      role: role as ProjectRole,
      grantedBy: session.user.id,
    });

    revalidatePath(`/orga`);

    return { success: true };
  } catch (error) {
    return { error: 'Failed to grant project access. Please try again.' };
  }
}

export async function revokeProjectAccess(
  accessId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    const store = await getStoreAsync();

    const access = await store.projectAccess.findById(accessId);
    if (!access) {
      return { success: false, error: 'Access record not found' };
    }

    const project = await store.projects.findById(access.projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const orgMembership = await store.organisationMembers.findByUserAndOrg(session.user.id, project.organisationId);
    const isOrgAdmin = orgMembership && ['OWNER', 'ADMIN'].includes(orgMembership.role);

    if (!isOrgAdmin) {
      const projectRole = await resolveProjectPermissions(session.user.id, access.projectId);
      if (projectRole !== 'ADMIN') {
        return { success: false, error: 'You do not have permission to revoke access to this project' };
      }
    }

    await store.projectAccess.revoke(accessId);

    revalidatePath(`/orga`);

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to revoke project access. Please try again.' };
  }
}

export async function updateProjectAccessRole(
  accessId: string,
  prevState: UpdateProjectAccessRoleState,
  formData: FormData
): Promise<UpdateProjectAccessRoleState> {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Authentication required' };
    }

    const role = formData.get('role') as string;

    if (!role || !VALID_PROJECT_ROLES.includes(role as ProjectRole)) {
      return {
        error: 'Role must be one of VIEWER, DEVELOPER, DEPLOYER, ADMIN',
        fieldErrors: { role: 'Must be VIEWER, DEVELOPER, DEPLOYER, or ADMIN' },
      };
    }

    const store = await getStoreAsync();

    const access = await store.projectAccess.findById(accessId);
    if (!access) {
      return { error: 'Access record not found' };
    }

    const project = await store.projects.findById(access.projectId);
    if (!project) {
      return { error: 'Project not found' };
    }

    const orgMembership = await store.organisationMembers.findByUserAndOrg(session.user.id, project.organisationId);
    const isOrgAdmin = orgMembership && ['OWNER', 'ADMIN'].includes(orgMembership.role);

    if (!isOrgAdmin) {
      const projectRole = await resolveProjectPermissions(session.user.id, access.projectId);
      if (projectRole !== 'ADMIN') {
        return { error: 'You do not have permission to update access roles for this project' };
      }
    }

    await store.projectAccess.updateRole(accessId, role as ProjectRole);

    revalidatePath(`/orga`);

    return { success: true };
  } catch (error) {
    return { error: 'Failed to update project access role. Please try again.' };
  }
}
