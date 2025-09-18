import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { organisationService, CreateOrganisationData } from '@/lib/services/organisation';
import { z } from 'zod';

const createOrganisationSchema = z.object({
  name: z.string().min(1, 'Organisation name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  logo: z.string().optional(),
});

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
    const validation = createOrganisationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validation.error.issues,
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