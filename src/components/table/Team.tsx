'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Button } from '@/components/common/Button';
import { Tooltip } from '@/components/common/Tooltip';
import { type Team, type User, type Organisation } from '@prisma/client';
import Link from 'next/link';

type TeamWithDetails = Team & {
  owner: User;
  organisation: Organisation;
  _count?: {
    members: number;
    projects: number;
  };
};

const columns: ColumnDef<TeamWithDetails>[] = [
  {
    header: 'Team Name',
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
          <div className="font-medium">{row.original.name}</div>
          {row.original.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {row.original.description}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    header: 'Organisation',
    accessorKey: 'organisation',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.original.organisation.name}</div>
    ),
  },
  {
    header: 'Members',
    accessorKey: '_count.members',
    meta: {
      align: 'text-center',
    },
    cell: ({ row }) => (
      <span className="inline-flex items-center justify-center w-8 h-6 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
        {row.original._count?.members || 0}
      </span>
    ),
  },
  {
    header: 'Projects',
    accessorKey: '_count.projects',
    meta: {
      align: 'text-center',
    },
    cell: ({ row }) => (
      <span className="inline-flex items-center justify-center w-8 h-6 text-sm font-medium bg-green-100 text-green-800 rounded-full">
        {row.original._count?.projects || 0}
      </span>
    ),
  },
  {
    header: 'Status',
    accessorKey: 'isActive',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        row.original.isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    header: 'Created',
    accessorKey: 'createdAt',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      format(new Date(row.original.createdAt), 'd MMM yyyy')
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    meta: {
      align: 'text-right',
    },
    cell: ({ row }) => (
      <span className="flex gap-2 justify-end">
        <Tooltip content="Edit Team" asChild>
          <Link href={`/admin/team/${row.original.id}`}>
            <Button
              type="button"
              variant="light"
              size="sm"
            >
              Edit
            </Button>
          </Link>
        </Tooltip>
        <Tooltip content="Delete Team" asChild>
          <Button
            type="button"
            variant="light"
            size="sm"
            //onClick={() => deleteTeam(row.original.id)}
          >
            Delete
          </Button>
        </Tooltip>
      </span>
    ),
  },
];

export { columns, type TeamWithDetails };