'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { organisationService } from '@/lib/services/organisation';
import { userService } from '@/lib/services/user';
import { validateNameFormat } from '@/lib/name-validation';

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
  organisationName?: string;
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

export interface DeleteOrganisationState {
  success?: boolean;
  error?: string;
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

    // Validate name format
    const nameValidation = validateNameFormat(name);
    if (!nameValidation.isValid) {
      return {
        error: nameValidation.error || 'Invalid organisation name',
        fieldErrors: { name: nameValidation.error || 'Invalid organisation name' }
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

    // Validate organisation name is not already in use (excluding current organisation)
    const nameAvailability = await organisationService.validateOrganisationName(name.trim(), organisationId);
    if (!nameAvailability.isValid) {
      return {
        error: nameAvailability.error || 'Organisation name is not available',
        fieldErrors: { name: nameAvailability.error || 'Organisation name is not available' }
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
    revalidatePath('/orga');
    revalidatePath(`/orga/${organisationId}`);

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

    // Validate name format
    const nameValidation = validateNameFormat(name);
    if (!nameValidation.isValid) {
      return {
        error: nameValidation.error || 'Invalid organisation name',
        fieldErrors: { name: nameValidation.error || 'Invalid organisation name' }
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

    // Validate organisation name is not already in use
    const nameAvailability = await organisationService.validateOrganisationName(name.trim());
    if (!nameAvailability.isValid) {
      return {
        error: nameAvailability.error || 'Organisation name is not available',
        fieldErrors: { name: nameAvailability.error || 'Organisation name is not available' }
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
    revalidatePath('/orga');

    return {
      success: true,
      organisationName: name.trim(),
    };
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

export async function deleteOrganisation(
  organisationId: string
): Promise<DeleteOrganisationState> {
  try {
    console.log('Delete organisation action called with ID:', organisationId);

    const session = await auth();
    if (!session) {
      console.log('No session found');
      return { error: 'Authentication required' };
    }

    console.log('User attempting deletion:', session.user.id, session.user.email);

    // Use service to delete organisation (soft delete)
    console.log('Calling organisationService.deleteOrganisation...');
    await organisationService.deleteOrganisation(organisationId, session.user.id);

    console.log('Organisation deleted successfully, revalidating paths...');
    revalidatePath('/admin/organisations');
    revalidatePath('/orga');
    revalidatePath(`/orga/${organisationId}`);

    console.log('Paths revalidated, returning success');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete organisation:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      error: error instanceof Error ? error.message : 'Failed to delete organisation. Please try again.',
    };
  }
}