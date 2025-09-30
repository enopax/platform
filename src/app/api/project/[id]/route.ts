import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { projectService, UpdateProjectData } from '@/lib/services/project';
import { prisma } from '@/lib/prisma';

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

    // Get project with organisation-centric structure
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
          }
        },
        assignedTeams: {
          include: {
            team: {
              include: {
                owner: true,
                members: {
                  select: {
                    userId: true
                  }
                },
                _count: {
                  select: {
                    members: true,
                    assignedProjects: true
                  }
                }
              }
            }
          }
        },
        allocatedResources: {
          select: {
            resource: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access - member of assigned teams or organisation member
    const isAdmin = session.user.role === 'ADMIN';

    // Check if user is a member of the organisation
    const isOrgMember = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId: project.organisationId
        }
      }
    });

    // Check if user is a member of any assigned teams
    const isTeamMember = project.assignedTeams.some(at =>
      at.team.members?.some(member => member.userId === session.user.id)
    );

    const hasAccess = isAdmin || isOrgMember || isTeamMember;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        organisation: project.organisation,
        assignedTeams: project.assignedTeams,
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
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        organisation: project.organisation,
        assignedTeams: project.assignedTeams,
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