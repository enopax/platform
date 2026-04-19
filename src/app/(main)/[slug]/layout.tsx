import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { OrganisationProvider } from '@/contexts/OrganisationContext';
import SidebarNavigation from '@/components/navigation/SidebarNavigation';
import MobileNavigation from '@/components/navigation/MobileNavigation';

async function getOrganisationData(store: any, org: any) {
  const projects = await store.projects.findByOrgId(org.id, { isActive: true });
  const members = await store.organisationMembers.findByOrgId(org.id);

  const activeShares = await store.projectShares.findSharedWithEntity('ORGANISATION', org.id, 'ACTIVE');
  const sharedProjects = [];
  for (const share of activeShares) {
    const project = await store.projects.findById(share.projectId);
    if (project && project.isActive) {
      const ownerOrg = await store.organisations.findById(project.organisationId);
      sharedProjects.push({ ...project, ownerName: ownerOrg?.name || 'Unknown', ownerSlug: ownerOrg?.slug || ownerOrg?.name || 'unknown' });
    }
  }

  return { projects, members, sharedProjects };
}

async function getUserOrganisations(store: any, userId: string) {
  const memberships = await store.organisationMembers.findByUserId(userId);
  const memberOrgIds = new Set(memberships.map((m: any) => m.organisationId));
  const allOrgs = await store.organisations.search('', 1000);
  const userOrgs = allOrgs.filter((org: any) =>
    org.isActive && (org.ownerId === userId || memberOrgIds.has(org.id))
  );

  const orgDataPromises = userOrgs
    .sort((a: any, b: any) => a.name.localeCompare(b.name))
    .map(async (org: any) => {
      const projects = await store.projects.findByOrgId(org.id, { isActive: true });
      return {
        id: org.id,
        name: org.name,
        projects: projects.map((p: any) => ({ id: p.id, name: p.name, status: p.status })),
      };
    });

  return Promise.all(orgDataPromises);
}

function renderOrgLayout(org: any, projects: any[], members: any[], sharedProjects: any[], organisations: any[], children: React.ReactNode) {
  return (
    <OrganisationProvider
      organisation={{
        id: org.id,
        name: org.name,
        description: org.description,
        ownerId: org.ownerId,
        isActive: org.isActive,
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
          <SidebarNavigation organisations={organisations} />
        </div>
        <MobileNavigation organisations={organisations} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </OrganisationProvider>
  );
}

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
  const session = await auth();
  const userId = session?.user?.id;

  const organisations = userId ? await getUserOrganisations(store, userId) : [];

  const namespace = await store.namespaces.findBySlug(slug);

  if (namespace?.entityType === 'ORGANISATION') {
    const organisation = await store.organisations.findById(namespace.entityId);
    if (!organisation || !organisation.isActive) notFound();

    const { projects, members, sharedProjects } = await getOrganisationData(store, organisation);
    return renderOrgLayout(organisation, projects, members, sharedProjects, organisations, children);
  }

  if (namespace?.entityType === 'USER') {
    const user = await store.users.findById(namespace.entityId);
    if (!user) notFound();
    return <>{children}</>;
  }

  const orgByName = await store.organisations.findByName(slug);
  if (orgByName && orgByName.isActive) {
    const { projects, members, sharedProjects } = await getOrganisationData(store, orgByName);
    return renderOrgLayout(orgByName, projects, members, sharedProjects, organisations, children);
  }

  notFound();
}
