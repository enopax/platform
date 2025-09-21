import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { projectService } from '@/lib/services/project';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organisationId = searchParams.get('organisationId');
    const teamId = searchParams.get('teamId');

    let projects;

    if (organisationId) {
      // Get projects for a specific organisation
      projects = await projectService.getOrganisationProjects(organisationId);
    } else if (teamId) {
      // Get projects for a specific team
      projects = await projectService.getTeamProjects(teamId);
    } else {
      // Get all projects the user has access to
      projects = await projectService.getUserProjects(session.user.id);
    }

    return NextResponse.json({
      success: true,
      projects: projects.map(project => ({
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
      })),
      count: projects.length,
    });

  } catch (error) {
    console.error('Project list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}