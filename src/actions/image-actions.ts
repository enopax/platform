'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface ImageUploadResult {
  success: boolean;
  error?: string;
  urls?: string[];
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB max
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'avatars');

/**
 * Filesystem-based image upload for account profiles
 * Saves images to the public directory and stores URL in database
 */
export async function uploadImageAction(prevState: ImageUploadResult | null, formData: FormData): Promise<ImageUploadResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
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
        error: 'Image is too large. Maximum size is 5MB.'
      };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
      };
    }

    // Create uploads directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `${session.user.id}-${timestamp}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Write file to filesystem
    const buffer = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));

    // Return relative URL for the image
    const imageUrl = `/uploads/avatars/${filename}`;

    // Revalidate account settings page
    revalidatePath('/account/settings');

    return {
      success: true,
      urls: [imageUrl],
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    };
  }
}