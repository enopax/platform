import { notFound } from 'next/navigation';
import { getStoreAsync } from '@/lib/store';
import { OrganisationProvider } from '@/contexts/OrganisationContext';

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

    return (
      <OrganisationProvider
        organisation={{
          id: organisation.id,
          name: organisation.name,
          description: organisation.description,
          ownerId: organisation.ownerId,
          isActive: organisation.isActive,
          projects,
          _count: {
            members: members.length,
            projects: projects.length,
          },
        }}
      >
        {children}
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

    return (
      <OrganisationProvider
        organisation={{
          id: orgByName.id,
          name: orgByName.name,
          description: orgByName.description,
          ownerId: orgByName.ownerId,
          isActive: orgByName.isActive,
          projects,
          _count: {
            members: members.length,
            projects: projects.length,
          },
        }}
      >
        {children}
      </OrganisationProvider>
    );
  }

  notFound();
}
