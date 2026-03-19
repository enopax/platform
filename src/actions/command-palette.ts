'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStoreAsync } from '@/lib/store';

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

    const store = await getStoreAsync();
    const memberships = await store.organisationMembers.findByUserId(session.user.id);

    return memberships.map(m => ({
      id: m.organisation.id,
      name: m.organisation.name,
    }));
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

    const store = await getStoreAsync();
    const isMember = await store.organisationMembers.findByUserAndOrg(session.user.id, organisationId);

    if (!isMember) {
      return [];
    }

    const allProjects = await store.projects.findByOrgId(organisationId);
    const projects = allProjects
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50)
      .map(p => ({ id: p.id, name: p.name, organisationId: p.organisationId }));

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
    const store = await getStoreAsync();
    const project = await store.projects.findById(projectId);

    if (!project) {
      return [];
    }
    const isMember = await store.organisationMembers.findByUserAndOrg(session.user.id, project.organisationId);

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
