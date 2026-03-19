import { notFound } from 'next/navigation';
import { getStoreAsync } from '@/lib/store';
import { prisma } from '@/lib/prisma';
import { ProjectProvider } from '@/contexts/ProjectContext';

export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ orgaName: string; projectName: string }>;
}>) {
  const { orgaName, projectName } = await params;

  if (!orgaName || !projectName) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(orgaName);

  if (!organisation) {
    notFound();
  }

  const projectFound = await store.projects.findByNameAndOrg(projectName, organisation.id);

  if (!projectFound || !projectFound.isActive) {
    notFound();
  }

  const allocatedResources = await prisma.projectResource.findMany({
    where: { projectId: projectFound.id },
    include: {
      resource: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
          organisation: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const filteredAllocatedResources = allocatedResources.filter(
    allocation => allocation.resource.isActive && allocation.resource.status === 'ACTIVE'
  );

  const project = {
    ...projectFound,
    budget: projectFound.budget?.toString() || null,
    organisation: { id: organisation.id, name: organisation.name },
    allocatedResources: filteredAllocatedResources,
    _count: { allocatedResources: allocatedResources.length },
  };

  return (
    <ProjectProvider project={project}>
      {children}
    </ProjectProvider>
  );
}
