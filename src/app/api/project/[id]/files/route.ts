import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { projectService } from '@/lib/services/project';
import { teamFilesService } from '@/lib/services/team-files';

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

    const projectId = params.id;

    // Check if user can access this project
    const canAccess = await projectService.canUserAccessProject(session.user.id, projectId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Get project details to get the team ID
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get project files using the team files service
    const files = await teamFilesService.getTeamFiles(session.user.id, project.teamId, projectId);

    return NextResponse.json({
      success: true,
      files: files.map(file => ({
        id: file.id,
        name: file.name,
        ipfsHash: file.ipfsHash,
        size: file.size,
        uploadedAt: file.uploadedAt,
        isPinned: file.isPinned,
        replicationCount: file.replicationCount,
        nodeLocations: file.nodeLocations,
        fileType: file.fileType,
        status: file.status,
        uploadedBy: file.uploadedBy,
        project: file.project,
      })),
      count: files.length,
      project: {
        id: project.id,
        name: project.name,
        assignedTeams: project.assignedTeams,
        organisation: project.organisation,
      },
    });

  } catch (error) {
    console.error('Project files get error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}