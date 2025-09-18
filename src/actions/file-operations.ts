'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { userFilesService } from '@/lib/services/user-files';
import { teamFilesService } from '@/lib/services/team-files';
import { storageQuotaService } from '@/lib/services/storage-quota';

export async function uploadFile(formData: FormData) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    const file = formData.get('file') as File;
    const teamId = formData.get('teamId') as string;
    const projectId = formData.get('projectId') as string;

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size is 100MB.' };
    }

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
        projectId || null,
        file
      );
    } else {
      uploadedFile = await userFilesService.uploadFile(session.user.id, file);
    }

    // Revalidate relevant pages
    revalidatePath('/main/files');
    if (teamId) {
      revalidatePath(`/main/teams/${teamId}`);
      if (projectId) {
        revalidatePath(`/main/projects/${projectId}`);
      }
    }

    return {
      success: true,
      file: {
        id: uploadedFile.id,
        name: uploadedFile.name,
        hash: uploadedFile.ipfsHash,
        size: uploadedFile.size,
      }
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
}

export async function deleteFile(fileId: string) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    // Use team file service which handles both team and personal files
    await teamFilesService.deleteTeamFile(session.user.id, fileId);

    // Revalidate the files page
    revalidatePath('/main/files');

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file'
    };
  }
}

export async function downloadFile(fileId: string) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    const downloadUrl = await userFilesService.getFileDownloadUrl(session.user.id, fileId);
    
    return { success: true, downloadUrl };
  } catch (error) {
    console.error('Download error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get download URL' 
    };
  }
}

export async function syncUserFiles() {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    await userFilesService.syncUserFilesWithCluster(session.user.id);
    
    // Revalidate the files page
    revalidatePath('/main/files');
    
    return { success: true, message: 'Files synced with IPFS cluster' };
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync files'
    };
  }
}

export async function checkTeamStorageQuota(teamId: string, fileSizeBytes: number) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    const quotaCheck = await teamFilesService.checkTeamStorageQuota(
      session.user.id,
      teamId,
      fileSizeBytes
    );

    return quotaCheck;
  } catch (error) {
    console.error('Quota check error:', error);
    return {
      allowed: false,
      reason: error instanceof Error ? error.message : 'Failed to check storage quota'
    };
  }
}

export async function getTeamFiles(teamId: string, projectId?: string) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    const files = await teamFilesService.getTeamFiles(
      session.user.id,
      teamId,
      projectId
    );

    return { success: true, files };
  } catch (error) {
    console.error('Get team files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch team files',
      files: []
    };
  }
}

export async function getTeamStorageStats(teamId: string) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    const stats = await teamFilesService.getTeamStorageStats(teamId);

    return { success: true, stats };
  } catch (error) {
    console.error('Get team storage stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch storage statistics'
    };
  }
}

export async function getUserStorageQuota() {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    const quota = await storageQuotaService.getUserStorageQuota(session.user.id);

    return { success: true, quota };
  } catch (error) {
    console.error('Get user storage quota error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch storage quota'
    };
  }
}

export async function getUserStorageStats() {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    const stats = await storageQuotaService.getUserStorageStats(session.user.id);

    return { success: true, stats };
  } catch (error) {
    console.error('Get user storage stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch storage stats'
    };
  }
}

export async function updateUserStorageTier(tier: 'FREE_500MB' | 'BASIC_5GB' | 'PRO_50GB' | 'ENTERPRISE_500GB' | 'UNLIMITED') {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    await storageQuotaService.updateUserStorageTier(session.user.id, tier);

    // Revalidate relevant pages
    revalidatePath('/main/resources');

    return { success: true, message: `Storage tier updated to ${tier}` };
  } catch (error) {
    console.error('Update storage tier error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update storage tier'
    };
  }
}