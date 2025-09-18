'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { teamStorageService } from '@/lib/services/team-storage';
import { StorageTier } from '@prisma/client';

export async function createTeamStorage(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    const teamId = formData.get('teamId') as string;
    const tier = formData.get('storageTier') as StorageTier;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!teamId || !tier) {
      return { success: false, error: 'Missing required fields' };
    }

    const storage = await teamStorageService.createTeamStorage(
      teamId,
      session.user.id,
      tier,
      name || undefined,
      description || undefined
    );

    revalidatePath(`/main/teams/${teamId}`);
    revalidatePath('/main/teams');

    return {
      success: true,
      storage: {
        id: storage.id,
        name: storage.name,
        tier: storage.tier,
      }
    };

  } catch (error) {
    console.error('Create team storage error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create team storage'
    };
  }
}

export async function updateTeamStorage(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    const teamId = formData.get('teamId') as string;
    const tier = formData.get('storageTier') as StorageTier;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!teamId) {
      return { success: false, error: 'Team ID is required' };
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (description !== null) updates.description = description || null;
    if (tier) updates.tier = tier;

    const storage = await teamStorageService.updateTeamStorage(
      teamId,
      session.user.id,
      updates
    );

    revalidatePath(`/main/teams/${teamId}`);
    revalidatePath('/main/teams');

    return {
      success: true,
      storage: {
        id: storage.id,
        name: storage.name,
        tier: storage.tier,
      }
    };

  } catch (error) {
    console.error('Update team storage error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update team storage'
    };
  }
}

export async function deleteTeamStorage(teamId: string) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    await teamStorageService.deleteTeamStorage(teamId, session.user.id);

    revalidatePath(`/main/teams/${teamId}`);
    revalidatePath('/main/teams');

    return { success: true };

  } catch (error) {
    console.error('Delete team storage error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete team storage'
    };
  }
}