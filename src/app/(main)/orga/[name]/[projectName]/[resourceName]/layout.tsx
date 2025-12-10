import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ResourceProvider } from '@/contexts/ResourceContext';

export default async function ResourceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ name: string; projectName: string; resourceName: string }>;
}>) {
  const { name, projectName, resourceName } = await params;

  // Validate that parameters are provided
  if (!name || !projectName || !resourceName) {
    notFound();
  }

  // Fetch the organisation by name
  const organisation = await prisma.organisation.findUnique({
    where: { name },
    select: { id: true },
  });

  if (!organisation) {
    notFound();
  }

  // Fetch the project by name and organisation
  const project = await prisma.project.findFirst({
    where: {
      name: projectName,
      organisationId: organisation.id,
      isActive: true,
    },
    select: { id: true },
  });

  if (!project) {
    notFound();
  }

  // Fetch the resource by name and organisation
  const resource = await prisma.resource.findFirst({
    where: {
      name: resourceName,
      organisationId: organisation.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      status: true,
      endpoint: true,
      organisationId: true,
      ownerId: true,
    },
  });

  if (!resource) {
    notFound();
  }

  return (
    <ResourceProvider resource={resource}>
      {children}
    </ResourceProvider>
  );
}
