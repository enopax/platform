'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganisation } from '@/contexts/OrganisationContext';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Callout } from '@/components/common/Callout';
import { Card } from '@/components/common/Card';
import Link from 'next/link';
import { RiUserAddLine, RiAlertLine, RiMailSendLine, RiCloseLine } from '@remixicon/react';
import Table from '@/components/GenericTable';
import { membershipRequestColumns, type MembershipRequestWithActions } from '@/components/table/MembershipRequests';
import { organisationMemberColumns, type OrganisationMemberWithActions } from '@/components/table/OrganisationMembers';
import { revokeInvitation } from '@/actions/invitation';

interface Member {
  id: string;
  role: string;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    email: string;
    image: string | null;
  };
}

interface JoinRequest {
  id: string;
  status: string;
  requestedAt: Date;
  user: {
    id: string;
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    email: string;
    image: string | null;
  };
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
}

interface MembersManagementClientProps {
  members: Member[];
  joinRequests: JoinRequest[];
  invitations: PendingInvitation[];
  organisationName: string;
  isOwner: boolean;
  isManager: boolean;
  isAdmin: boolean;
  currentUserId: string;
}

export function MembersManagementClient({
  members,
  joinRequests,
  invitations,
  organisationName,
  isOwner,
  isManager,
  isAdmin,
  currentUserId
}: MembersManagementClientProps) {
  const organisation = useOrganisation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const hasNewRequests = joinRequests.length > 0;
  const hasInvitations = invitations.length > 0;
  const canManage = isOwner || isManager || isAdmin;

  const handleRevoke = (id: string) => {
    if (!confirm('Revoke this invitation? The link will stop working immediately.')) return;
    setRevokingId(id);
    startTransition(async () => {
      try {
        await revokeInvitation(id);
        router.refresh();
      } finally {
        setRevokingId(null);
      }
    });
  };

  return (
    <main className="mt-4">
      <Container>
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Headline>Members & Requests</Headline>
          {canManage && (
            <Link href={`/${organisationName}/members/invite`}>
              <Button>
                <RiUserAddLine className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </Link>
          )}
        </div>

        {/* New Requests Notification */}
        {hasNewRequests && (
          <Callout
            icon={RiAlertLine}
            variant="warning"
            title="New membership requests!"
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              {joinRequests.length} user{joinRequests.length !== 1 ? 's' : ''} waiting for approval.
            </div>
          </Callout>
        )}

        {/* Join Requests Section */}
        {hasNewRequests && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Pending Requests ({joinRequests.length})
            </h2>

            <Table
              pageNumber={1}
              tableSize={joinRequests.length}
              tableData={joinRequests.map(request => ({
                ...request,
                organisationId: organisation.id
              })) as MembershipRequestWithActions[]}
              tableColumns={membershipRequestColumns}
              actions={undefined as any}
            />
          </div>
        )}

        {/* Pending Invitations */}
        {hasInvitations && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Pending Invitations ({invitations.length})
            </h2>
            <Card className="divide-y divide-gray-200 dark:divide-gray-700">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full flex-shrink-0">
                      <RiMailSendLine className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {invitation.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Invited {invitation.createdAt.toLocaleDateString('en-GB')} · expires {invitation.expiresAt.toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant="neutral">{invitation.role}</Badge>
                    <Badge variant="warning">Pending</Badge>
                    {canManage && (
                      <Button
                        type="button"
                        variant="light"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRevoke(invitation.id)}
                        disabled={isPending && revokingId === invitation.id}
                      >
                        <RiCloseLine className="h-4 w-4 mr-1" />
                        {isPending && revokingId === invitation.id ? 'Revoking…' : 'Revoke'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Members Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Organisation Members ({members.length})
          </h2>

          {members.length > 0 ? (
            <Table
              pageNumber={1}
              tableSize={members.length}
              tableData={members.map(member => ({
                ...member,
                organisationId: organisation.id,
                currentUserId,
                isAdmin,
                canManageMembers: canManage
              })) as OrganisationMemberWithActions[]}
              tableColumns={organisationMemberColumns}
              actions={undefined as any}
            />
          ) : (
            <p className="my-20">
              No members available
            </p>
          )}
        </div>
      </Container>
    </main>
  );
}
