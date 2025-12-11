'use client';

import { useOrganisation } from '@/contexts/OrganisationContext';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import Link from 'next/link';
import { RiUserAddLine, RiAlertLine } from '@remixicon/react';
import Table from '@/components/GenericTable';
import { membershipRequestColumns, type MembershipRequestWithActions } from '@/components/table/MembershipRequests';
import { organisationMemberColumns, type OrganisationMemberWithActions } from '@/components/table/OrganisationMembers';

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

interface MembersManagementClientProps {
  members: Member[];
  joinRequests: JoinRequest[];
  isOwner: boolean;
  isManager: boolean;
  isAdmin: boolean;
  currentUserId: string;
}

export function MembersManagementClient({
  members,
  joinRequests,
  isOwner,
  isManager,
  isAdmin,
  currentUserId
}: MembersManagementClientProps) {
  const organisation = useOrganisation();
  const hasNewRequests = joinRequests.length > 0;
  const canManage = isOwner || isManager || isAdmin;

  return (
    <main className="mt-4">
      <Container>
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Headline>Members & Requests</Headline>
          {canManage && (
            <Button>
              <RiUserAddLine className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
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
