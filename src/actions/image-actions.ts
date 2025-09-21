'use server';

import { auth } from '@/lib/auth';
import { userFilesService } from '@/lib/services/user-files';
import { storageQuotaService } from '@/lib/services/storage-quota';
import { revalidatePath } from 'next/cache';

export interface ImageUploadResult {
  success: boolean;
  error?: string;
  urls?: string[];
  fileInfo?: {
    id: string;
    name: string;
    size: number;
    hash: string;
  }[];
}

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB max
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function uploadImageAction(prevState: ImageUploadResult | null, formData: FormData): Promise<ImageUploadResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const files = formData.getAll('images') as File[];
    if (!files || files.length === 0) {
      return { success: false, error: 'No images selected' };
    }

    // Validate each image
    for (const file of files) {
      // Check if it's actually a file and not empty
      if (!file || file.size === 0) {
        return { success: false, error: 'One or more files are invalid' };
      }

      // Check file size (max 1MB)
      if (file.size > MAX_IMAGE_SIZE) {
        return {
          success: false,
          error: `Image "${file.name}" is too large. Maximum size is 1MB.`
        };
      }

      // Check file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
          success: false,
          error: `Invalid file type for "${file.name}". Only JPEG, PNG, GIF, and WebP images are allowed.`
        };
      }
    }

    // Calculate total size for quota check
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // Check storage quota
    const quotaCheck = await storageQuotaService.checkStorageQuota(session.user.id, totalSize);
    if (!quotaCheck.allowed) {
      return {
        success: false,
        error: quotaCheck.reason || 'Storage quota exceeded'
      };
    }

    // Upload all images to IPFS
    const uploadedFiles = [];
    const urls = [];

    for (const file of files) {
      try {
        const uploadedFile = await userFilesService.uploadFile(session.user.id, file);

        uploadedFiles.push({
          id: uploadedFile.id,
          name: uploadedFile.name,
          size: uploadedFile.size,
          hash: uploadedFile.ipfsHash,
        });

        // Create IPFS gateway URL
        const gatewayUrl = `https://ipfs.io/ipfs/${uploadedFile.ipfsHash}`;
        urls.push(gatewayUrl);
      } catch (uploadError) {
        console.error(`Failed to upload ${file.name}:`, uploadError);
        return {
          success: false,
          error: `Failed to upload "${file.name}": ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
        };
      }
    }

    // Revalidate the resources page to show new files
    revalidatePath('/main/resources');

    return {
      success: true,
      urls,
      fileInfo: uploadedFiles,
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload images'
    };
  }
}

export async function deleteImageAction(imageId: string): Promise<ImageUploadResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    await userFilesService.deleteFile(session.user.id, imageId);

    // Revalidate the resources page
    revalidatePath('/main/resources');

    return { success: true };

  } catch (error) {
    console.error('Image delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image'
    };
  }
}

export async function getImageDownloadUrlAction(imageId: string): Promise<ImageUploadResult & { downloadUrl?: string }> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const downloadUrl = await userFilesService.getFileDownloadUrl(session.user.id, imageId);

    return {
      success: true,
      downloadUrl,
    };

  } catch (error) {
    console.error('Get image download URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get download URL'
    };
  }
}