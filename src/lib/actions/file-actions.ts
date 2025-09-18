'use server';

import { auth } from '@/lib/auth';
import { userFilesService } from '@/lib/services/user-files';
import { teamFilesService } from '@/lib/services/team-files';
import { storageQuotaService } from '@/lib/services/storage-quota';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { fileUploadSchema, fileDeleteSchema, fileSearchSchema, validateFormData } from '@/lib/validation/file-schemas';

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
    const validation = validateFormData(fileUploadSchema, formData);
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
    const validation = validateFormData(fileDeleteSchema, formData);
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
    const validation = validateFormData(fileSearchSchema, formData);
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