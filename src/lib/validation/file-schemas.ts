// Simple validation functions without zod dependency

export interface FileUploadData {
  file: File;
  teamId?: string;
  projectId?: string;
}

export interface FileDeleteData {
  fileId: string;
  teamId?: string;
  isTeamFile?: boolean;
}

export interface FileSearchData {
  query: string;
  teamId?: string;
}

export interface ImageUploadData {
  images: File[];
}

export interface TeamFileData {
  teamId: string;
  projectId?: string;
  file?: File;
  fileId?: string;
}

// File upload validation
export function validateFileUpload(data: any): { success: true; data: FileUploadData } | { success: false; error: string } {
  if (!data.file || !(data.file instanceof File)) {
    return { success: false, error: 'File is required' };
  }

  if (data.file.size > 100 * 1024 * 1024) {
    return { success: false, error: 'File size must be less than 100MB' };
  }

  if (data.file.size === 0) {
    return { success: false, error: 'File cannot be empty' };
  }

  return {
    success: true,
    data: {
      file: data.file,
      teamId: data.teamId || undefined,
      projectId: data.projectId || undefined,
    }
  };
}

// File delete validation
export function validateFileDelete(data: any): { success: true; data: FileDeleteData } | { success: false; error: string } {
  if (!data.fileId || typeof data.fileId !== 'string' || data.fileId.trim().length === 0) {
    return { success: false, error: 'File ID is required' };
  }

  return {
    success: true,
    data: {
      fileId: data.fileId,
      teamId: data.teamId || undefined,
      isTeamFile: data.isTeamFile || undefined,
    }
  };
}

// File search validation
export function validateFileSearch(data: any): { success: true; data: FileSearchData } | { success: false; error: string } {
  if (!data.query || typeof data.query !== 'string' || data.query.trim().length === 0) {
    return { success: false, error: 'Search query is required' };
  }

  if (data.query.length > 100) {
    return { success: false, error: 'Search query too long' };
  }

  return {
    success: true,
    data: {
      query: data.query,
      teamId: data.teamId || undefined,
    }
  };
}

// Image upload validation
export function validateImageUpload(data: any): { success: true; data: ImageUploadData } | { success: false; error: string } {
  if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
    return { success: false, error: 'At least one image is required' };
  }

  if (!data.images.every(file => file instanceof File)) {
    return { success: false, error: 'All items must be files' };
  }

  if (!data.images.every(file => file.type.startsWith('image/'))) {
    return { success: false, error: 'All files must be images' };
  }

  if (!data.images.every(file => file.size <= 10 * 1024 * 1024)) {
    return { success: false, error: 'Each image must be less than 10MB' };
  }

  return {
    success: true,
    data: { images: data.images }
  };
}

// Team file validation
export function validateTeamFile(data: any): { success: true; data: TeamFileData } | { success: false; error: string } {
  if (!data.teamId || typeof data.teamId !== 'string' || data.teamId.trim().length === 0) {
    return { success: false, error: 'Team ID is required' };
  }

  return {
    success: true,
    data: {
      teamId: data.teamId,
      projectId: data.projectId || undefined,
      file: data.file || undefined,
      fileId: data.fileId || undefined,
    }
  };
}

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