'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Button } from '@/components/common/Button';
import { Tooltip } from '@/components/common/Tooltip';
import { Badge } from '@/components/common/Badge';
import { type Team, type User, type Organisation, type TeamMember } from '@prisma/client';
import Link from 'next/link';
import { 
  RiUserLine, 
  RiProjectorLine, 
  RiSettings4Line,
  RiTeamLine 
} from '@remixicon/react';

type TeamWithDetails = Team & {
  owner: User;
  organisation: Organisation;
  members: (TeamMember & {
    user: User;
  })[];
  _count?: {
    members: number;
    projects: number;
  };
};

const columns: ColumnDef<TeamWithDetails>[] = [
  {
    header: 'Team',
    accessorKey: 'name',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.color && (
          <div 
            className="w-4 h-4 rounded-full mr-3 border border-gray-300"
            style={{ backgroundColor: row.original.color }}
          />
        )}
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {row.original.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.original.organisation.name}
          </div>
          {row.original.description && (
            <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs mt-1">
              {row.original.description}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    header: 'Members',
    accessorKey: '_count.members',
    meta: {
      align: 'text-center',
    },
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <RiUserLine className="w-4 h-4 text-gray-400 mr-1" />
        <span className="text-sm font-medium">
          {row.original._count?.members || 0}
        </span>
      </div>
    ),
  },
  {
    header: 'Projects',
    accessorKey: '_count.projects',
    meta: {
      align: 'text-center',
    },
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <RiProjectorLine className="w-4 h-4 text-gray-400 mr-1" />
        <span className="text-sm font-medium">
          {row.original._count?.projects || 0}
        </span>
      </div>
    ),
  },
  {
    header: 'Status',
    accessorKey: 'isActive',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'outline'} className="text-xs">
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    header: 'Created',
    accessorKey: 'createdAt',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {format(new Date(row.original.createdAt), 'd MMM yyyy')}
      </span>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    meta: {
      align: 'text-right',
    },
    cell: ({ row, table }) => {
      const currentUserId = (table.options.meta as any)?.currentUserId;
      const isOwnerOrLead = row.original.ownerId === currentUserId || 
        row.original.members.find(m => m.userId === currentUserId)?.role === 'LEAD';

      return (
        <div className="flex gap-2 justify-end">
          <Tooltip content="View Team" asChild>
            <Link href={`/main/teams/${row.original.id}`}>
              <Button
                type="button"
                variant="light"
                size="sm"
              >
                View
              </Button>
            </Link>
          </Tooltip>
        </div>
      );
    },
  },
];

export { columns, type TeamWithDetails };