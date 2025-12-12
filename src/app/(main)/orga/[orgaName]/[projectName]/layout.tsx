import { notFound } from 'next/navigation';
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

  // Validate that parameters are provided
  if (!orgaName || !projectName) {
    notFound();
  }

  // Fetch the organisation by name (minimal data, full is in OrganisationContext)
  const organisation = await prisma.organisation.findUnique({
    where: { name: orgaName },
    select: { id: true, name: true },
  });

  if (!organisation) {
    notFound();
  }

  // Fetch the full project with all related data
  const projectRaw = await prisma.project.findFirst({
    where: {
      name: projectName,
      organisationId: organisation.id,
      isActive: true,
    },
    include: {
      organisation: {
        select: {
          id: true,
          name: true,
        },
      },
      allocatedResources: {
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
      },
      _count: {
        select: {
          allocatedResources: true,
        },
      },
    },
  });

  if (!projectRaw) {
    notFound();
  }

  // Filter allocated resources to only active ones
  const filteredAllocatedResources = projectRaw.allocatedResources.filter(
    allocation => allocation.resource.isActive && allocation.resource.status === 'ACTIVE'
  );

  // Convert Decimal budget to string for client components
  const project = {
    ...projectRaw,
    budget: projectRaw.budget?.toString() || null,
    allocatedResources: filteredAllocatedResources,
  };

  return (
    <ProjectProvider project={project}>
      {children}
    </ProjectProvider>
  );
}
