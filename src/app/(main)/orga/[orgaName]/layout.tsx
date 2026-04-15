import { notFound } from 'next/navigation';
import { getStoreAsync } from '@/lib/store';
import { OrganisationProvider } from '@/contexts/OrganisationContext';

export default async function OrganisationLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ orgaName: string }>;
}>) {
  const { orgaName } = await params;

  if (!orgaName) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(orgaName);

  if (!organisation || !organisation.isActive) {
    notFound();
  }

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
