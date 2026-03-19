import { notFound } from 'next/navigation';
import { getStoreAsync } from '@/lib/store';
import { prisma } from '@/lib/prisma';
import { ResourceProvider } from '@/contexts/ResourceContext';

export default async function ResourceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ orgaName: string; projectName: string; resourceName: string }>;
}>) {
  const { orgaName, projectName, resourceName } = await params;

  if (!orgaName || !projectName || !resourceName) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(orgaName);

  if (!organisation) {
    notFound();
  }

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
