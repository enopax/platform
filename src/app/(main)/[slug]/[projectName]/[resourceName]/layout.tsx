import { notFound } from 'next/navigation';
import { getStoreAsync } from '@/lib/store';
import { ResourceProvider } from '@/contexts/ResourceContext';

export default async function ResourceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string; projectName: string; resourceName: string }>;
}>) {
  const { slug, projectName, resourceName } = await params;

  if (!slug || !projectName || !resourceName) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(slug);

  if (!organisation) {
    notFound();
  }

  const projectFound = await store.projects.findByNameAndOrg(projectName, organisation.id);
  const project = projectFound?.isActive ? projectFound : null;

  if (!project) {
    notFound();
  }

  // Fetch the resource by name and organisation
  const foundResource = await store.resources.findByNameAndOrg(resourceName, organisation.id);
  const resource = foundResource?.isActive ? {
    id: foundResource.id,
    name: foundResource.name,
    description: foundResource.description,
    type: foundResource.type,
    status: foundResource.status,
    endpoint: foundResource.endpoint,
    organisationId: foundResource.organisationId,
    ownerId: foundResource.ownerId,
  } : null;

  if (!resource) {
    notFound();
  }

  return (
    <ResourceProvider resource={resource}>
      {children}
    </ResourceProvider>
  );
}
