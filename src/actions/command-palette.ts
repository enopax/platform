'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface CommandPaletteOrganisation {
  id: string;
  name: string;
}

export interface CommandPaletteProject {
  id: string;
  name: string;
  organisationId: string;
}

export interface CommandPaletteResource {
  id: string;
  name: string;
  type: string;
  status: string;
  projectId: string;
  projectName: string;
  organisationId: string;
  organisationName: string;
}

export async function getUserOrganisations(): Promise<CommandPaletteOrganisation[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const memberships = await prisma.organisationMember.findMany({
      where: { userId: session.user.id },
      select: {
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(m => m.organisation);
  } catch (error) {
    console.error('Failed to fetch user organisations:', error);
    return [];
  }
}

export async function getOrganisationProjects(organisationId: string): Promise<CommandPaletteProject[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    // Verify user is a member of the organisation
    const isMember = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId,
        },
      },
    });

    if (!isMember) {
      return [];
    }

    const projects = await prisma.project.findMany({
      where: { organisationId },
      select: {
        id: true,
        name: true,
        organisationId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit results for performance
    });

    return projects;
  } catch (error) {
    console.error('Failed to fetch organisation projects:', error);
    return [];
  }
}

export async function getProjectResources(projectId: string): Promise<CommandPaletteResource[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    // First, get the project to find its organisation
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organisationId: true },
    });

    if (!project) {
      return [];
    }

    // Verify user is a member of the organisation
    const isMember = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId: project.organisationId,
        },
      },
    });

    if (!isMember) {
      return [];
    }

    // Get resources allocated to this project via the ProjectResource junction table
    const projectResources = await prisma.projectResource.findMany({
      where: { projectId },
      include: {
        project: {
          select: {
            name: true,
            organisation: {
              select: {
                name: true,
              },
            },
          },
        },
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            organisationId: true,
          },
        },
      },
      orderBy: { allocatedAt: 'desc' },
      take: 50, // Limit results for performance
    });

    return projectResources.map(pr => ({
      id: pr.resource.id,
      name: pr.resource.name,
      type: pr.resource.type,
      status: pr.resource.status,
      projectId,
      projectName: pr.project.name,
      organisationId: pr.resource.organisationId,
      organisationName: pr.project.organisation.name,
    }));
  } catch (error) {
    console.error('Failed to fetch project resources:', error);
    return [];
  }
}
