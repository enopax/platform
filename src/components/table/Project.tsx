'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Button } from '@/components/common/Button';
import { Tooltip } from '@/components/common/Tooltip';
import { type Project, type User, type Organisation, type ProjectStatus, type ProjectPriority, type Team } from '@prisma/client';
import Link from 'next/link';

type ProjectWithDetails = Project & {
  team: Team & {
    owner: User;
    organisation: Organisation;
  };
  organisation: Organisation;
};

const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case 'PLANNING':
      return 'bg-gray-100 text-gray-800';
    case 'ACTIVE':
      return 'bg-blue-100 text-blue-800';
    case 'ON_HOLD':
      return 'bg-yellow-100 text-yellow-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: ProjectPriority) => {
  switch (priority) {
    case 'LOW':
      return 'bg-green-100 text-green-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800';
    case 'URGENT':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const columns: ColumnDef<ProjectWithDetails>[] = [
  {
    header: 'Project Name',
    accessorKey: 'name',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        {row.original.description && (
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {row.original.description}
          </div>
        )}
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
    header: 'Team',
    accessorKey: 'team',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => {
      const { team } = row.original;
      const ownerName = team.owner.name || (team.owner.firstname && team.owner.lastname ? `${team.owner.firstname} ${team.owner.lastname}` : team.owner.firstname || team.owner.lastname || team.owner.email);
      return (
        <div>
          <div className="font-medium">{team.name}</div>
          <div className="text-sm text-gray-500">Lead: {ownerName}</div>
        </div>
      );
    },
  },
  {
    header: 'Status',
    accessorKey: 'status',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.original.status)}`}>
        {row.original.status.replace('_', ' ')}
      </span>
    ),
  },
  {
    header: 'Priority',
    accessorKey: 'priority',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(row.original.priority)}`}>
        {row.original.priority}
      </span>
    ),
  },
  {
    header: 'Progress',
    accessorKey: 'progress',
    meta: {
      align: 'text-center',
    },
    cell: ({ row }) => (
      <div className="flex items-center">
        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${row.original.progress}%` }}
          ></div>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {row.original.progress}%
        </span>
      </div>
    ),
  },
  {
    header: 'Timeline',
    accessorKey: 'timeline',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.startDate && (
          <div className="text-gray-900">
            Start: {format(new Date(row.original.startDate), 'd MMM yyyy')}
          </div>
        )}
        {row.original.endDate && (
          <div className={`${
            row.original.actualEndDate && row.original.actualEndDate > row.original.endDate
              ? 'text-red-600'
              : 'text-gray-500'
          }`}>
            End: {format(new Date(row.original.endDate), 'd MMM yyyy')}
          </div>
        )}
        {row.original.actualEndDate && (
          <div className="text-green-600">
            Actual: {format(new Date(row.original.actualEndDate), 'd MMM yyyy')}
          </div>
        )}
      </div>
    ),
  },
  {
    header: 'Budget',
    accessorKey: 'budget',
    meta: {
      align: 'text-right',
    },
    cell: ({ row }) => (
      row.original.budget ? (
        <div className="text-sm">
          <span className="font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: row.original.currency || 'USD',
            }).format(parseFloat(row.original.budget))}
          </span>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      )
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
        <Tooltip content="Edit Project" asChild>
          <Link href={`/admin/project/${row.original.id}`}>
            <Button
              type="button"
              variant="light"
              size="sm"
            >
              Edit
            </Button>
          </Link>
        </Tooltip>
        <Tooltip content="Delete Project" asChild>
          <Button
            type="button"
            variant="light"
            size="sm"
            //onClick={() => deleteProject(row.original.id)}
          >
            Delete
          </Button>
        </Tooltip>
      </span>
    ),
  },
];

export { columns, type ProjectWithDetails };