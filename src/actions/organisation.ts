'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { organisationService } from '@/lib/services/organisation';
import { userService } from '@/lib/services/user';
import { validateNameFormat } from '@/lib/name-validation';
import { updateOrganisationSchema, createOrganisationSchema, parseFormData } from '@/lib/form-schemas';

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
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Authentication required' };
    }

    const parsed = parseFormData(updateOrganisationSchema, formData);
    if (!parsed.success) return { error: parsed.error, fieldErrors: parsed.fieldErrors };
    const { name, description, website, email, phone, address, visibility } = parsed.data;

    const nameValidation = validateNameFormat(name, 'organisation');
    if (!nameValidation.isValid) {
      return {
        error: nameValidation.error || 'Invalid organisation name',
        fieldErrors: { name: nameValidation.error || 'Invalid organisation name' }
      };
    }

    const nameAvailability = await organisationService.validateOrganisationName(name.trim(), organisationId);
    if (!nameAvailability.isValid) {
      return {
        error: nameAvailability.error || 'Organisation name is not available',
        fieldErrors: { name: nameAvailability.error || 'Organisation name is not available' }
      };
    }

    await organisationService.updateOrganisation(organisationId, session.user.id, {
      name: name.trim(),
      description: description?.trim() || undefined,
      website: website?.trim() || undefined,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
      visibility: visibility || undefined,
    });

    revalidatePath('/admin/organisation');
    revalidatePath(`/admin/organisation/${organisationId}`);
    revalidatePath('/orga');
    revalidatePath(`/${name.trim()}`);

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
    const parsed = parseFormData(createOrganisationSchema, formData);
    if (!parsed.success) return { error: parsed.error, fieldErrors: parsed.fieldErrors };
    const { name, description, website, email, phone, address, ownerId } = parsed.data;

    const nameValidation = validateNameFormat(name, 'organisation');
    if (!nameValidation.isValid) {
      return {
        error: nameValidation.error || 'Invalid organisation name',
        fieldErrors: { name: nameValidation.error || 'Invalid organisation name' }
      };
    }

    const ownerExists = await userService.validateUserExists(ownerId);
    if (!ownerExists) {
      return {
        error: 'Selected owner does not exist',
        fieldErrors: { ownerId: 'Selected owner does not exist' }
      };
    }

    const nameAvailability = await organisationService.validateOrganisationName(name.trim());
    if (!nameAvailability.isValid) {
      return {
        error: nameAvailability.error || 'Organisation name is not available',
        fieldErrors: { name: nameAvailability.error || 'Organisation name is not available' }
      };
    }

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

    // Look up org name before deletion so we can revalidate the name-based route
    const store = await getStoreAsync();
    const organisation = await store.organisations.findById(organisationId);

    // Use service to delete organisation (soft delete)
    console.log('Calling organisationService.deleteOrganisation...');
    await organisationService.deleteOrganisation(organisationId, session.user.id);

    console.log('Organisation deleted successfully, revalidating paths...');
    revalidatePath('/admin/organisations');
    revalidatePath('/orga');
    if (organisation?.name) {
      revalidatePath(`/${organisation.name}`);
    }

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