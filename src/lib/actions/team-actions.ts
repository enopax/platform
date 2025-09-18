'use server';

import { auth } from '@/lib/auth';
import { teamFilesService } from '@/lib/services/team-files';
import { revalidatePath } from 'next/cache';

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export async function getTeamFilesAction(teamId: string, projectId?: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const teamFiles = await teamFilesService.getTeamFiles(session.user.id, teamId, projectId);

    return {
      success: true,
      data: teamFiles
    };

  } catch (error) {
    console.error('Get team files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get team files'
    };
  }
}

export async function uploadTeamFileAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const file = formData.get('file') as File;
    const teamId = formData.get('teamId') as string;
    const projectId = formData.get('projectId') as string | null;

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (!teamId) {
      return { success: false, error: 'Team ID is required' };
    }

    // Validate file size
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size is 100MB' };
    }

    const uploadedFile = await teamFilesService.uploadFileToTeam(
      session.user.id,
      teamId,
      projectId,
      file
    );

    // Revalidate team pages
    revalidatePath(`/main/teams/${teamId}`);
    if (projectId) {
      revalidatePath(`/main/projects/${projectId}`);
    }

    return {
      success: true,
      data: {
        hash: uploadedFile.ipfsHash,
        name: uploadedFile.name,
        size: uploadedFile.size,
        id: uploadedFile.id,
      }
    };

  } catch (error) {
    console.error('Team upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file to team'
    };
  }
}

export async function deleteTeamFileAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const fileId = formData.get('fileId') as string;
    const teamId = formData.get('teamId') as string;

    if (!fileId) {
      return { success: false, error: 'File ID is required' };
    }

    await teamFilesService.deleteTeamFile(session.user.id, fileId);

    // Revalidate team pages
    revalidatePath(`/main/teams/${teamId}`);
    revalidatePath('/main/teams');

    return { success: true };

  } catch (error) {
    console.error('Delete team file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete team file'
    };
  }
}

export async function getTeamStorageStatsAction(teamId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const stats = await teamFilesService.getTeamStorageStats(teamId);

    return {
      success: true,
      data: stats
    };

  } catch (error) {
    console.error('Get team storage stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get team storage stats'
    };
  }
}