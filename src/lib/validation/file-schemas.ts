import { z } from 'zod';

// File upload validation schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  teamId: z.string().optional(),
  projectId: z.string().optional(),
}).refine((data) => {
  // Validate file size (100MB max)
  if (data.file.size > 100 * 1024 * 1024) {
    return false;
  }
  return true;
}, {
  message: 'File size must be less than 100MB',
  path: ['file']
}).refine((data) => {
  // Validate file type (basic check)
  if (data.file.size === 0) {
    return false;
  }
  return true;
}, {
  message: 'File cannot be empty',
  path: ['file']
});

// File delete validation schema
export const fileDeleteSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  teamId: z.string().optional(),
  isTeamFile: z.boolean().optional(),
});

// File search validation schema
export const fileSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  teamId: z.string().optional(),
});

// Image upload validation schema
export const imageUploadSchema = z.object({
  images: z.array(z.instanceof(File)).min(1, 'At least one image is required'),
}).refine((data) => {
  // Validate all files are images
  return data.images.every(file => file.type.startsWith('image/'));
}, {
  message: 'All files must be images',
  path: ['images']
}).refine((data) => {
  // Validate file sizes (10MB max per image)
  return data.images.every(file => file.size <= 10 * 1024 * 1024);
}, {
  message: 'Each image must be less than 10MB',
  path: ['images']
});

// Team file operations validation schema
export const teamFileSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  projectId: z.string().optional(),
  file: z.instanceof(File, { message: 'File is required' }).optional(),
  fileId: z.string().optional(),
}).refine((data) => {
  // For upload operations, file is required
  // For other operations, fileId might be required
  return true; // Additional validation can be added based on operation type
});

// Form data parsing helper
export function parseFormDataToObject(formData: FormData): Record<string, any> {
  const obj: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      // Handle file inputs
      if (obj[key]) {
        // Multiple files with same name
        if (Array.isArray(obj[key])) {
          obj[key].push(value);
        } else {
          obj[key] = [obj[key], value];
        }
      } else {
        obj[key] = value;
      }
    } else {
      // Handle regular form fields
      if (obj[key]) {
        // Multiple values with same name
        if (Array.isArray(obj[key])) {
          obj[key].push(value);
        } else {
          obj[key] = [obj[key], value];
        }
      } else {
        obj[key] = value;
      }
    }
  }

  return obj;
}

// Validation helper function
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData
): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsedData = parseFormDataToObject(formData);
    const result = schema.parse(parsedData);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors?.[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed'
      };
    }
    return {
      success: false,
      error: 'Validation failed'
    };
  }
}