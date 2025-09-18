'use server';

import { put } from '@vercel/blob';
import sharp from 'sharp';
import { auth } from '@/lib/auth';
import { imageUploadSchema, validateFormData } from '@/lib/validation/file-schemas';

export interface ImageUploadResult {
  success: boolean;
  error?: string;
  urls?: string[];
}

export async function uploadImageAction(prevState: any, formData: FormData): Promise<ImageUploadResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate form data
    const validation = validateFormData(imageUploadSchema, formData);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const { images } = validation.data;

    const uploadedUrls: string[] = [];

    for (const file of images) {
      try {

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        // Process image with Sharp
        const resizedImage = await sharp(imageBuffer)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        // Upload to Vercel Blob
        const blob = await put(file.name, resizedImage, {
          access: 'public',
          allowOverwrite: true,
        });

        uploadedUrls.push(blob.url);
      } catch (fileError) {
        console.error(`Error processing ${file.name}:`, fileError);
        return {
          success: false,
          error: `Failed to process ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`
        };
      }
    }

    return {
      success: true,
      urls: uploadedUrls
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image upload failed'
    };
  }
}