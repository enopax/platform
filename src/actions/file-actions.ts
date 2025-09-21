'use server';

import { auth } from '@/lib/auth';
import { userFilesService } from '@/lib/services/user-files';
import { teamFilesService } from '@/lib/services/team-files';
import { storageQuotaService } from '@/lib/services/storage-quota';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { validateFileUpload, validateFileDelete, validateFileSearch, parseFormDataToObject } from '@/lib/validation/file-schemas';

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export async function uploadFileAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate form data
    const parsedData = parseFormDataToObject(formData);
    const validation = validateFileUpload(parsedData);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const { file, teamId, projectId } = validation.data;

    // Check storage quota for personal uploads
    if (!teamId) {
      const quotaCheck = await storageQuotaService.checkStorageQuota(session.user.id, file.size);
      if (!quotaCheck.allowed) {
        return { success: false, error: quotaCheck.reason || 'Storage quota exceeded' };
      }
    }

    let uploadedFile;

    // Upload to team storage if teamId provided, otherwise personal storage
    if (teamId) {
      uploadedFile = await teamFilesService.uploadFileToTeam(
        session.user.id,
        teamId,
        projectId,
        file
      );
    } else {
      uploadedFile = await userFilesService.uploadFile(session.user.id, file);
    }

    // Revalidate the relevant pages
    revalidatePath('/main/resources');
    if (teamId) {
      revalidatePath(`/main/teams/${teamId}`);
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
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    };
  }
}

export async function deleteFileAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate form data
    const parsedData = parseFormDataToObject(formData);
    const validation = validateFileDelete(parsedData);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const { fileId, isTeamFile } = validation.data;

    if (isTeamFile) {
      await teamFilesService.deleteTeamFile(session.user.id, fileId);
    } else {
      await userFilesService.deleteFile(session.user.id, fileId);
    }

    // Revalidate the relevant pages
    revalidatePath('/main/resources');
    revalidatePath('/main/teams');

    return { success: true };

  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file'
    };
  }
}

export async function syncFilesAction(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    await userFilesService.syncUserFilesWithCluster(session.user.id);

    // Revalidate the resources page
    revalidatePath('/main/resources');

    return { success: true };

  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync files'
    };
  }
}

export async function getFileDownloadUrlAction(fileId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const downloadUrl = await userFilesService.getFileDownloadUrl(session.user.id, fileId);

    return {
      success: true,
      data: { downloadUrl }
    };

  } catch (error) {
    console.error('Download URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get download URL'
    };
  }
}

export async function searchFilesAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate form data
    const parsedData = parseFormDataToObject(formData);
    const validation = validateFileSearch(parsedData);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const { query, teamId } = validation.data;

    let results;
    if (teamId) {
      // Search team files (you might need to add this method to teamFilesService)
      results = await userFilesService.searchUserFiles(session.user.id, query);
    } else {
      results = await userFilesService.searchUserFiles(session.user.id, query);
    }

    return {
      success: true,
      data: results
    };

  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    };
  }
}

export async function checkTeamStorageQuotaAction(teamId: string, fileSizeBytes: number): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const quotaCheck = await teamFilesService.checkTeamStorageQuota(
      session.user.id,
      teamId,
      fileSizeBytes
    );

    return {
      success: true,
      data: quotaCheck
    };

  } catch (error) {
    console.error('Quota check error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check storage quota'
    };
  }
}

export async function getTeamFilesAction(teamId: string, projectId?: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const files = await teamFilesService.getTeamFiles(
      session.user.id,
      teamId,
      projectId
    );

    return {
      success: true,
      data: files
    };

  } catch (error) {
    console.error('Get team files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch team files'
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
      error: error instanceof Error ? error.message : 'Failed to fetch storage statistics'
    };
  }
}

export async function getUserStorageQuotaAction(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const quota = await storageQuotaService.getUserStorageQuota(session.user.id);

    return {
      success: true,
      data: quota
    };

  } catch (error) {
    console.error('Get user storage quota error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch storage quota'
    };
  }
}

export async function getUserStorageStatsAction(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const stats = await storageQuotaService.getUserStorageStats(session.user.id);

    return {
      success: true,
      data: stats
    };

  } catch (error) {
    console.error('Get user storage stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch storage stats'
    };
  }
}

export async function updateUserStorageTierAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const tier = formData.get('tier') as string;
    if (!tier) {
      return { success: false, error: 'Storage tier is required' };
    }

    const validTiers = ['FREE_500MB', 'BASIC_5GB', 'PRO_50GB', 'ENTERPRISE_500GB', 'UNLIMITED'];
    if (!validTiers.includes(tier)) {
      return { success: false, error: 'Invalid storage tier' };
    }

    await storageQuotaService.updateUserStorageTier(session.user.id, tier as any);

    revalidatePath('/main/resources');

    return {
      success: true,
      data: { message: `Storage tier updated to ${tier}` }
    };

  } catch (error) {
    console.error('Update storage tier error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update storage tier'
    };
  }
}