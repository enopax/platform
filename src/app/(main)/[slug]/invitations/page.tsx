import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Callout } from '@/components/common/Callout';
import { RiMailLine, RiBuildingLine, RiInformationLine } from '@remixicon/react';
import AcceptShareButton from '@/components/project/AcceptShareButton';
import DeclineShareButton from '@/components/project/DeclineShareButton';

interface InvitationsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function InvitationsPage({ params }: InvitationsPageProps) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(slug);
  if (!organisation) notFound();

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisation.id);
  const isOrgAdmin =
    session.user.role === 'ADMIN' ||
    (membership && ['OWNER', 'ADMIN'].includes(membership.role));

  if (!isOrgAdmin) {
    notFound();
  }

  const pendingShares = await store.projectShares.findSharedWithEntity('ORGANISATION', organisation.id, 'INVITED');

  const invitationsWithDetails = await Promise.all(
    pendingShares.map(async (share) => {
      const project = await store.projects.findById(share.projectId);
      const hostOrg = project ? await store.organisations.findById(project.organisationId) : null;
      return {
        ...share,
        projectName: project?.name ?? share.projectId,
        hostOrgName: hostOrg?.name ?? share.projectId,
      };
    })
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invitations</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Pending project collaboration invitations for {organisation.name}
          </p>
        </div>
      </div>

      <Callout variant="default" title="Project invitations" icon={RiInformationLine} className="mb-6">
        Accepting an invitation lets your teams be granted access to shared projects.
        Declining removes the invitation without granting any access.
      </Callout>

      {invitationsWithDetails.length === 0 ? (
        <Card className="p-12 text-center">
          <RiMailLine className="mx-auto w-10 h-10 text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            No pending invitations
          </p>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {invitationsWithDetails.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between px-6 py-4 flex-wrap gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                    <RiBuildingLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {invitation.projectName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      from {invitation.hostOrgName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default" className="text-xs">
                        {invitation.permission}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AcceptShareButton
                    shareId={invitation.id}
                    organisationName={slug}
                  />
                  <DeclineShareButton
                    shareId={invitation.id}
                    organisationName={slug}
                    projectName={invitation.projectName}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
