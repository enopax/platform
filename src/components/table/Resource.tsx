'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Button } from '@/components/common/Button';
import { Tooltip } from '@/components/common/Tooltip';
import { Badge } from '@/components/common/Badge';
import { type Resource, type User, type Team } from '@prisma/client';
import Link from 'next/link';
import {
  RiServerLine,
  RiTeamLine,
  RiSettings4Line,
  RiFolderLine,
  RiEditLine,
  RiDeleteBinLine,
  RiDatabaseLine,
  RiHardDrive2Line
} from '@remixicon/react';

type ResourceWithDetails = Resource & {
  owner: User;
  team?: Team | null;
  organisation?: { id: string; name: string } | null;
  storageMetrics?: {
    totalSize: number;
    usedSize: number;
    availableSize: number;
  } | null;
};

const getResourceTypeVariant = (type: string) => {
  switch (type) {
    case 'COMPUTE': return 'default';
    case 'STORAGE': return 'secondary';
    case 'DATABASE': return 'outline';
    case 'NETWORK': return 'outline';
    case 'API': return 'outline';
    default: return 'outline';
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'default';
    case 'INACTIVE': return 'outline';
    case 'MAINTENANCE': return 'secondary';
    case 'DELETED': return 'outline';
    default: return 'outline';
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const columns: ColumnDef<ResourceWithDetails>[] = [
  {
    header: 'Resource',
    accessorKey: 'name',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div className="flex items-center">
        <RiServerLine className="w-5 h-5 text-gray-400 mr-3" />
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {row.original.name}
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
    header: 'Type',
    accessorKey: 'type',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <Badge variant={getResourceTypeVariant(row.original.type)} className="text-xs">
        {row.original.type}
      </Badge>
    ),
  },
  {
    header: 'Team',
    accessorKey: 'team.name',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.team ? (
          <>
            <RiTeamLine className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {row.original.team.name}
            </span>
          </>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            –
          </span>
        )}
      </div>
    ),
  },
  {
    header: 'Storage Used',
    accessorKey: 'storageMetrics.usedSize',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => {
      const metrics = row.original.storageMetrics;
      if (!metrics) {
        return (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            –
          </span>
        );
      }

      const usagePercentage = metrics.totalSize > 0
        ? Math.round((metrics.usedSize / metrics.totalSize) * 100)
        : 0;

      return (
        <div className="flex items-center">
          <RiDatabaseLine className="w-4 h-4 text-blue-500 mr-2" />
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {formatBytes(metrics.usedSize)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {usagePercentage}% used
            </div>
          </div>
        </div>
      );
    },
  },
  {
    header: 'Storage Available',
    accessorKey: 'storageMetrics.availableSize',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => {
      const metrics = row.original.storageMetrics;
      if (!metrics) {
        return (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            –
          </span>
        );
      }

      return (
        <div className="flex items-center">
          <RiHardDrive2Line className="w-4 h-4 text-green-500 mr-2" />
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {formatBytes(metrics.availableSize)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              of {formatBytes(metrics.totalSize)}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    meta: {
      align: 'text-right',
    },
    cell: ({ row, table }) => {
      const currentUserId = (table.options.meta as any)?.currentUserId;
      const isOwner = row.original.ownerId === currentUserId;
      const canManage = isOwner || (row.original.team &&
        // Note: We'd need to check if user is team lead/member with permissions
        true // Simplified for now
      );

      const orgId = row.original.organisationId;
      const resourceViewUrl = orgId
        ? `/main/organisations/${organisation.name}`
        : `/main/resources/${row.original.id}`;
      const resourceEditUrl = orgId
        ? `/main/organisations/${organisation.name}/edit`
        : `/main/resources/${row.original.id}/edit`;

      return (
        <div className="flex gap-2 justify-end">
          <Tooltip content="View Files" asChild>
            <Link href={resourceViewUrl}>
              <Button
                type="button"
                variant="light"
                size="sm"
              >
                <RiFolderLine className="w-4 h-4" />
              </Button>
            </Link>
          </Tooltip>
          {canManage && (
            <Tooltip content="Edit Resource" asChild>
              <Link href={resourceEditUrl}>
                <Button
                  type="button"
                  variant="light"
                  size="sm"
                >
                  <RiEditLine className="w-4 h-4" />
                </Button>
              </Link>
            </Tooltip>
          )}
        </div>
      );
    },
  },
];

export { columns, type ResourceWithDetails };