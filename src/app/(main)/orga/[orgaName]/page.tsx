import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { checkOrganisationPermissions } from '@/lib/permissions';
import { getStoreAsync } from '@/lib/store';
import OrganisationOverviewClient from '@/components/OrganisationOverviewClient';

interface OrganisationOverviewPageProps {
  params: Promise<{ orgaName: string }>;
}

export default async function OrganisationOverviewPage({ params }: OrganisationOverviewPageProps) {
  const { orgaName } = await params;
  const session = await auth();

  if (!orgaName) {
    notFound();
  }

  // Get organisation ID for permission check
  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(orgaName);
  if (!organisation) notFound();

  // Check permissions using the permission helper
  const permissions = await checkOrganisationPermissions(
    session.user.id,
    session.user.role,
    organisation.id
  );

  // Deny access if not a member and not an admin
  if (!permissions.isMember && !permissions.isAdmin) {
    notFound();
  }

  return <OrganisationOverviewClient canManage={permissions.canManage} />;
}