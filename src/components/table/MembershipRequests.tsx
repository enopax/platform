'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { RiCheckLine, RiCloseLine, RiUserLine } from '@remixicon/react';
import { respondToJoinRequest } from '@/actions/organisationJoinRequest';
import { useState } from 'react';

interface JoinRequest {
  id: string;
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

type MembershipRequestWithActions = JoinRequest & {
  organisationId: string;
};

const MembershipRequestActions = ({ request }: { request: MembershipRequestWithActions }) => {
  const [processing, setProcessing] = useState(false);

  const handleResponse = async (status: 'APPROVED' | 'REJECTED') => {
    setProcessing(true);
    try {
      await respondToJoinRequest(request.id, status);
      window.location.reload();
    } catch (error) {
      console.error('Failed to respond to request:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex gap-1 justify-end">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleResponse('APPROVED')}
        disabled={processing}
      >
        Accept
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleResponse('REJECTED')}
        disabled={processing}
      >
        Decline
      </Button>
    </div>
  );
};

const membershipRequestColumns: ColumnDef<MembershipRequestWithActions>[] = [
  {
    header: 'User',
    accessorKey: 'user',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => {
      const { user } = row.original;
      const displayName = user.name || 
        (user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : user.firstname) || 
        user.email.split('@')[0];
      
      return (
        <div className="flex items-center">
          {user.image ? (
            <img 
              src={user.image} 
              alt={displayName} 
              className="w-6 h-6 rounded-full mr-2 object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 mr-2 flex items-center justify-center">
              <RiUserLine className="w-3 h-3 text-gray-500" />
            </div>
          )}
          <div>
            <div className="font-medium text-sm">{displayName}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    header: 'Requested',
    accessorKey: 'requestedAt',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <span className="text-sm">
        {new Date(row.original.requestedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </span>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    meta: {
      align: 'text-right',
    },
    cell: ({ row }) => (
      <MembershipRequestActions request={row.original} />
    ),
  },
];

export { membershipRequestColumns, type MembershipRequestWithActions };