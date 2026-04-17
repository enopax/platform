import { notFound } from 'next/navigation';
import { getStoreAsync } from '@/lib/store';
import { ProjectProvider } from '@/contexts/ProjectContext';

export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string; projectName: string }>;
}>) {
  const { slug, projectName } = await params;

  if (!slug || !projectName) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(slug);

  if (!organisation) {
    notFound();
  }

  const projectFound = await store.projects.findByNameAndOrg(projectName, organisation.id);

  if (!projectFound || !projectFound.isActive) {
    notFound();
  }

  const projectAllocations = await store.projectResources.findByProjectId(projectFound.id);

  const allocatedResources = [];
  for (const allocation of projectAllocations) {
    const resource = await store.resources.findById(allocation.resourceId);
    if (resource) {
      const owner = await store.users.findById(resource.ownerId);
      allocatedResources.push({
        ...allocation,
        resource: {
          ...resource,
          owner: owner ? {
            id: owner.id,
            name: owner.name,
            firstname: owner.firstname,
            lastname: owner.lastname,
            email: owner.email,
          } : null,
          organisation: {
            id: organisation.id,
            name: organisation.name,
          },
        },
      });
    }
  }

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
