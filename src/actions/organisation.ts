'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logOrganisationMembershipChange } from '@/lib/auditLog';

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
    const ownerExists = await prisma.user.findUnique({
      where: { id: ownerId }
    });

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

    await prisma.organisation.update({
      where: { id: organisationId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        website: website?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        ownerId,
        isActive,
      },
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
    const ownerExists = await prisma.user.findUnique({
      where: { id: ownerId }
    });

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

    const organisation = await prisma.organisation.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        website: website?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        ownerId,
      },
    });

    // Also add the owner as a member with OWNER role
    await prisma.organisationMember.create({
      data: {
        userId: ownerId,
        organisationId: organisation.id,
        role: 'OWNER',
      },
    });

    // Log the owner addition
    await logOrganisationMembershipChange(
      organisation.id,
      ownerId,
      ownerId, // Owner added themselves
      'ADDED',
      undefined,
      'OWNER',
      'Organisation created'
    );

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
    // Search organisations by name or description
    const organisations = await prisma.organisation.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        isActive: true, // Only show active organisations
      },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        email: true,
        isActive: true,
        owner: {
          select: {
            name: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            teams: true,
            projects: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { name: 'asc' },
      ],
      take: 10, // Limit to 10 results
    });

    return organisations;
  } catch (error) {
    console.error('Failed to search organisations:', error);
    return [];
  }
}