import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { projectService, UpdateProjectData } from '@/lib/services/project';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check if user can access this project
    const canAccess = await projectService.canUserAccessProject(session.user.id, projectId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Get project details
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        budget: project.budget,
        currency: project.currency,
        startDate: project.startDate,
        endDate: project.endDate,
        actualEndDate: project.actualEndDate,
        progress: project.progress,
        repositoryUrl: project.repositoryUrl,
        documentationUrl: project.documentationUrl,
        organisationId: project.organisationId,
        teamId: project.teamId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        organisation: project.organisation,
        team: project.team,
        fileCount: project.fileCount,
      },
    });

  } catch (error) {
    console.error('Project get error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Parse request body
    const data: UpdateProjectData = await request.json();

    // Update the project
    const project = await projectService.updateProject(session.user.id, projectId, data);

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        budget: project.budget,
        currency: project.currency,
        startDate: project.startDate,
        endDate: project.endDate,
        actualEndDate: project.actualEndDate,
        progress: project.progress,
        repositoryUrl: project.repositoryUrl,
        documentationUrl: project.documentationUrl,
        organisationId: project.organisationId,
        teamId: project.teamId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        organisation: project.organisation,
        team: project.team,
        fileCount: project.fileCount,
      },
    });

  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Delete the project (soft delete)
    await projectService.deleteProject(session.user.id, projectId);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });

  } catch (error) {
    console.error('Project delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}