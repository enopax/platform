'use server';

import { revalidatePath } from 'next/cache';
import { organisationService } from '@/lib/services/organisation';
import { userService } from '@/lib/services/user';

export interface UpdateOrganisationState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    description?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    ownerId?: string;
  };
}

export interface CreateOrganisationState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    description?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    ownerId?: string;
  };
}

export async function updateOrganisation(
  organisationId: string,
  prevState: UpdateOrganisationState,
  formData: FormData
): Promise<UpdateOrganisationState> {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const website = formData.get('website') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const ownerId = formData.get('ownerId') as string;
    const isActive = formData.get('isActive') === 'true';

    // Basic validation
    if (!name || name.trim().length < 2) {
      return {
        error: 'Organisation name must be at least 2 characters long',
        fieldErrors: { name: 'Organisation name must be at least 2 characters long' }
      };
    }

    if (!ownerId) {
      return {
        error: 'Owner is required',
        fieldErrors: { ownerId: 'Owner is required' }
      };
    }

    // Validate owner exists
    const ownerExists = await userService.validateUserExists(ownerId);
    if (!ownerExists) {
      return {
        error: 'Selected owner does not exist',
        fieldErrors: { ownerId: 'Selected owner does not exist' }
      };
    }

    // Validate email format if provided
    if (email && !email.includes('@')) {
      return {
        error: 'Invalid email format',
        fieldErrors: { email: 'Invalid email format' }
      };
    }

    // Validate website URL format if provided
    if (website && website.trim()) {
      try {
        new URL(website.startsWith('http') ? website : `https://${website}`);
      } catch {
        return {
          error: 'Invalid website URL format',
          fieldErrors: { website: 'Invalid website URL format' }
        };
      }
    }

    // Use service to update organisation (this will need to be implemented in the service)
    await organisationService.updateOrganisation(organisationId, ownerId, {
      name: name.trim(),
      description: description?.trim() || undefined,
      website: website?.trim() || undefined,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
    });

    revalidatePath('/admin/organisation');
    revalidatePath(`/admin/organisation/${organisationId}`);
    revalidatePath('/main/organisations');
    revalidatePath(`/main/organisations/${organisationId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update organisation:', error);
    return {
      error: 'Failed to update organisation. Please try again.',
    };
  }
}

export async function createOrganisation(
  prevState: CreateOrganisationState,
  formData: FormData
): Promise<CreateOrganisationState> {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const website = formData.get('website') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const ownerId = formData.get('ownerId') as string;

    // Basic validation
    if (!name || name.trim().length < 2) {
      return {
        error: 'Organisation name must be at least 2 characters long',
        fieldErrors: { name: 'Organisation name must be at least 2 characters long' }
      };
    }

    if (!ownerId) {
      return {
        error: 'Owner is required',
        fieldErrors: { ownerId: 'Owner is required' }
      };
    }

    // Validate owner exists
    const ownerExists = await userService.validateUserExists(ownerId);
    if (!ownerExists) {
      return {
        error: 'Selected owner does not exist',
        fieldErrors: { ownerId: 'Selected owner does not exist' }
      };
    }

    // Validate email format if provided
    if (email && !email.includes('@')) {
      return {
        error: 'Invalid email format',
        fieldErrors: { email: 'Invalid email format' }
      };
    }

    // Validate website URL format if provided
    if (website && website.trim()) {
      try {
        new URL(website.startsWith('http') ? website : `https://${website}`);
      } catch {
        return {
          error: 'Invalid website URL format',
          fieldErrors: { website: 'Invalid website URL format' }
        };
      }
    }

    // Use service to create organisation
    await organisationService.createOrganisation(ownerId, {
      name: name.trim(),
      description: description?.trim() || undefined,
      website: website?.trim() || undefined,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
    });

    revalidatePath('/admin/organisation');

    return { success: true };
  } catch (error) {
    console.error('Failed to create organisation:', error);
    return {
      error: 'Failed to create organisation. Please try again.',
    };
  }
}

// Real database organisation search function
export async function findOrganisations(query: string) {
  try {
    // Use service to search organisations
    // This would need to be implemented in the service
    const organisations = await organisationService.searchOrganisations(query);
    return organisations;
  } catch (error) {
    console.error('Failed to search organisations:', error);
    return [];
  }
}