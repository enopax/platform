import { notFound } from 'next/navigation';
import { getStoreAsync } from '@/lib/store';
import { OrganisationProvider } from '@/contexts/OrganisationContext';
import OrgSidebar from '@/components/navigation/OrgSidebar';

export default async function NamespaceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const store = await getStoreAsync();

  const namespace = await store.namespaces.findBySlug(slug);

  if (namespace?.entityType === 'ORGANISATION') {
    const organisation = await store.organisations.findById(namespace.entityId);
    if (!organisation || !organisation.isActive) notFound();

    const projects = await store.projects.findByOrgId(organisation.id, { isActive: true });
    const members = await store.organisationMembers.findByOrgId(organisation.id);

    const activeShares = await store.projectShares.findSharedWithEntity('ORGANISATION', organisation.id, 'ACTIVE');
    const sharedProjects = [];
    for (const share of activeShares) {
      const project = await store.projects.findById(share.projectId);
      if (project && project.isActive) {
        const ownerOrg = await store.organisations.findById(project.organisationId);
        sharedProjects.push({ ...project, ownerName: ownerOrg?.name || 'Unknown', ownerSlug: ownerOrg?.slug || ownerOrg?.name || 'unknown' });
      }
    }

    return (
      <OrganisationProvider
        organisation={{
          id: organisation.id,
          name: organisation.name,
          description: organisation.description,
          ownerId: organisation.ownerId,
          isActive: organisation.isActive,
          projects,
          sharedProjects,
          _count: {
            members: members.length,
            projects: projects.length,
          },
        }}
      >
        <div className="flex min-h-[calc(100vh-2.5rem)]">
          <div className="hidden lg:block sticky top-0 h-screen overflow-y-auto">
            <OrgSidebar />
          </div>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </OrganisationProvider>
    );
  }

  if (namespace?.entityType === 'USER') {
    const user = await store.users.findById(namespace.entityId);
    if (!user) notFound();
    return <>{children}</>;
  }

  const orgByName = await store.organisations.findByName(slug);
  if (orgByName && orgByName.isActive) {
    const projects = await store.projects.findByOrgId(orgByName.id, { isActive: true });
    const members = await store.organisationMembers.findByOrgId(orgByName.id);

    const activeShares = await store.projectShares.findSharedWithEntity('ORGANISATION', orgByName.id, 'ACTIVE');
    const sharedProjects = [];
    for (const share of activeShares) {
      const project = await store.projects.findById(share.projectId);
      if (project && project.isActive) {
        const ownerOrg = await store.organisations.findById(project.organisationId);
        sharedProjects.push({ ...project, ownerName: ownerOrg?.name || 'Unknown', ownerSlug: ownerOrg?.slug || ownerOrg?.name || 'unknown' });
      }
    }

    return (
      <OrganisationProvider
        organisation={{
          id: orgByName.id,
          name: orgByName.name,
          description: orgByName.description,
          ownerId: orgByName.ownerId,
          isActive: orgByName.isActive,
          projects,
          sharedProjects,
          _count: {
            members: members.length,
            projects: projects.length,
          },
        }}
      >
        <div className="flex min-h-[calc(100vh-2.5rem)]">
          <div className="hidden lg:block sticky top-0 h-screen overflow-y-auto">
            <OrgSidebar />
          </div>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </OrganisationProvider>
    );
  }

  notFound();
}
