import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { checkOrganisationPermissions } from '@/lib/permissions';
import OrganisationOverviewClient from '@/components/OrganisationOverviewClient';

interface NamespacePageProps {
  params: Promise<{ slug: string }>;
}

export default async function NamespacePage({ params }: NamespacePageProps) {
  const { slug } = await params;
  const store = await getStoreAsync();

  const namespace = await store.namespaces.findBySlug(slug);

  if (namespace?.entityType === 'ORGANISATION') {
    const organisation = await store.organisations.findById(namespace.entityId);
    if (!organisation || !organisation.isActive) notFound();

    const session = await auth();
    const permissions = await checkOrganisationPermissions(
      session.user.id,
      session.user.role,
      organisation.id
    );

    if (!permissions.isMember && !permissions.isAdmin) notFound();

    return <OrganisationOverviewClient canManage={permissions.canManage} />;
  }

  if (namespace?.entityType === 'USER') {
    const user = await store.users.findById(namespace.entityId);
    if (!user) notFound();

    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">{user.name || user.slug}</h1>
        <p className="text-gray-500 mt-2">Personal projects coming soon</p>
      </main>
    );
  }

  const orgByName = await store.organisations.findByName(slug);
  if (orgByName && orgByName.isActive) {
    const session = await auth();
    const permissions = await checkOrganisationPermissions(
      session.user.id,
      session.user.role,
      orgByName.id
    );

    if (!permissions.isMember && !permissions.isAdmin) notFound();

    return <OrganisationOverviewClient canManage={permissions.canManage} />;
  }

  notFound();
}
