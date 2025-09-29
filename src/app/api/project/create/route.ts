import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { projectService, CreateProjectData } from '@/lib/services/project';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data: CreateProjectData = await request.json();

    // Create the project
    const project = await projectService.createProject(session.user.id, data);

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
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        organisation: project.organisation,
        assignedTeams: project.assignedTeams,
        fileCount: project.fileCount,
      },
    });

  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}