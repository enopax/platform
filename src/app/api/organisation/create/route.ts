import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { organisationService, CreateOrganisationData } from '@/lib/services/organisation';

function validateCreateOrganisationData(data: any): { success: true; data: CreateOrganisationData } | { success: false; error: string; issues?: any[] } {
  const errors: any[] = [];

  // Name validation (required for creation)
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ path: ['name'], message: 'Organisation name is required' });
  } else if (data.name.length > 100) {
    errors.push({ path: ['name'], message: 'Name must be less than 100 characters' });
  }

  // Website validation
  if (data.website !== undefined && data.website !== '') {
    if (typeof data.website !== 'string') {
      errors.push({ path: ['website'], message: 'Website must be a string' });
    } else {
      try {
        new URL(data.website);
      } catch {
        errors.push({ path: ['website'], message: 'Invalid website URL' });
      }
    }
  }

  // Email validation
  if (data.email !== undefined && data.email !== '') {
    if (typeof data.email !== 'string') {
      errors.push({ path: ['email'], message: 'Email must be a string' });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push({ path: ['email'], message: 'Invalid email address' });
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, error: 'Invalid input data', issues: errors };
  }

  return {
    success: true,
    data: {
      name: data.name,
      description: data.description,
      website: data.website || undefined,
      address: data.address,
      phone: data.phone,
      email: data.email || undefined,
      logo: data.logo,
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validation = validateCreateOrganisationData(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          details: validation.issues,
        },
        { status: 400 }
      );
    }

    const data: CreateOrganisationData = validation.data;

    // Check if organisation name is already taken
    const isNameAvailable = await organisationService.validateOrganisationName(data.name);
    if (!isNameAvailable) {
      return NextResponse.json(
        { error: 'Organisation name is already taken' },
        { status: 409 }
      );
    }

    // Create the organisation
    const organisation = await organisationService.createOrganisation(session.user.id, data);

    return NextResponse.json({
      success: true,
      organisation: {
        id: organisation.id,
        name: organisation.name,
        description: organisation.description,
        website: organisation.website,
        address: organisation.address,
        phone: organisation.phone,
        email: organisation.email,
        logo: organisation.logo,
        isActive: organisation.isActive,
        createdAt: organisation.createdAt,
        memberCount: organisation.memberCount,
        teamCount: organisation.teamCount,
        projectCount: organisation.projectCount,
      },
    });

  } catch (error) {
    console.error('Organisation creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}