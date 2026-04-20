import { z } from 'zod';

export const updateOrganisationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  website: z.string().optional().default(''),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  isActive: z.string().transform(v => v === 'true').optional().default('true'),
});

export const createOrganisationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  website: z.string().optional().default(''),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  ownerId: z.string().min(1, 'Owner is required'),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  organisationId: z.string().min(1, 'Organisation is required'),
  repositoryUrl: z.string().optional().default(''),
  documentationUrl: z.string().optional().default(''),
  budget: z.string().optional().default(''),
});

export const updateProjectSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  repositoryUrl: z.string().optional().default(''),
  documentationUrl: z.string().optional().default(''),
  budget: z.string().optional().default(''),
  status: z.string().optional(),
  priority: z.string().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().default(''),
  defaultProjectRole: z.string().min(1, 'Default project role is required'),
  organisationId: z.string().min(1),
});

export const updateTeamSchema = z.object({
  teamId: z.string().min(1),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().default(''),
  defaultProjectRole: z.string().min(1, 'Default project role is required'),
});

export const createResourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  projectId: z.string().min(1, 'Project is required'),
  organisationName: z.string().optional().default(''),
  isPublic: z.string().optional().transform(v => v === 'on'),
  templateId: z.string().optional().default(''),
});

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().default(''),
  rank: z.string().optional().transform(v => v ? parseInt(v, 10) : 10),
});

export function parseFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): { success: true; data: z.infer<T> } | { success: false; error: string; fieldErrors: Record<string, string> } {
  const raw = Object.fromEntries(formData);
  const result = schema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString();
      if (field) fieldErrors[field] = issue.message;
    }
    const firstError = result.error.issues[0]?.message || 'Invalid form data';
    return { success: false, error: firstError, fieldErrors };
  }

  return { success: true, data: result.data };
}
