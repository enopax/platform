'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface ImageUploadResult {
  success: boolean;
  error?: string;
  urls?: string[];
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB max
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Lightweight image upload for account profiles
 * Converts images to base64 data URIs for storage
 */
export async function uploadImageAction(prevState: ImageUploadResult | null, formData: FormData): Promise<ImageUploadResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorised' };
    }

    const files = formData.getAll('images') as File[];
    if (!files || files.length === 0) {
      return { success: false, error: 'No images selected' };
    }

    // Take only the first file for profile images
    const file = files[0];

    // Validate file
    if (!file || file.size === 0) {
      return { success: false, error: 'File is invalid' };
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return {
        success: false,
        error: `Image is too large. Maximum size is 5MB.`
      };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
      };
    }

    // Convert image to base64 data URI
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Revalidate account settings page
    revalidatePath('/account/settings');

    return {
      success: true,
      urls: [dataUri],
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    };
  }
}