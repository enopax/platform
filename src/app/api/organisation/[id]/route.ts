import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { organisationService, CreateOrganisationData } from '@/lib/services/organisation';
import { z } from 'zod';

const updateOrganisationSchema = z.object({
  name: z.string().min(1, 'Organisation name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  logo: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: organisationId } = params;

    // Check if user is a member of the organisation
    const isMember = await organisationService.isUserMember(session.user.id, organisationId);
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get organisation details
    const organisation = await organisationService.getOrganisationById(organisationId);
    if (!organisation) {
      return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
    }

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
        ownerId: organisation.ownerId,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt,
        memberCount: organisation.memberCount,
        teamCount: organisation.teamCount,
        projectCount: organisation.projectCount,
      },
    });

  } catch (error) {
    console.error('Get organisation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: organisationId } = params;

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validation = updateOrganisationSchema.safeParse(body);
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

    // Check if organisation name is already taken (excluding current organisation)
    if (data.name) {
      const isNameAvailable = await organisationService.validateOrganisationName(data.name, organisationId);
      if (!isNameAvailable) {
        return NextResponse.json(
          { error: 'Organisation name is already taken' },
          { status: 409 }
        );
      }
    }

    // Update the organisation
    const organisation = await organisationService.updateOrganisation(organisationId, session.user.id, data);

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
        ownerId: organisation.ownerId,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt,
        memberCount: organisation.memberCount,
        teamCount: organisation.teamCount,
        projectCount: organisation.projectCount,
      },
    });

  } catch (error) {
    console.error('Update organisation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: organisationId } = params;

    // Delete the organisation (soft delete)
    await organisationService.deleteOrganisation(organisationId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Organisation deactivated successfully',
    });

  } catch (error) {
    console.error('Delete organisation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}