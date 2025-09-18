'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { type ApiKey } from '@prisma/client';
import {
  RiKeyLine,
  RiDeleteBinLine,
  RiTimeLine,
  RiEyeLine,
  RiShieldLine
} from '@remixicon/react';

// Get status badge variant
function getStatusVariant(isActive: boolean, expiresAt: Date | null): 'default' | 'warning' | 'destructive' {
  if (!isActive) return 'destructive';
  if (expiresAt && new Date() > expiresAt) return 'destructive';
  if (expiresAt && new Date() > new Date(expiresAt.getTime() - 7 * 24 * 60 * 60 * 1000)) return 'warning';
  return 'default';
}

// Get status text
function getStatusText(isActive: boolean, expiresAt: Date | null): string {
  if (!isActive) return 'Inactive';
  if (expiresAt && new Date() > expiresAt) return 'Expired';
  if (expiresAt && new Date() > new Date(expiresAt.getTime() - 7 * 24 * 60 * 60 * 1000)) return 'Expiring Soon';
  return 'Active';
}

// Format the last used date
function formatLastUsed(date: Date | null): string {
  if (!date) return 'Never used';
  return format(date, 'PPp');
}

const columns: ColumnDef<ApiKey>[] = [
  {
    header: 'API Key',
    accessorKey: 'name',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div className="flex items-center">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mr-3">
          <RiKeyLine className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {row.original.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {row.original.keyPreview}...
          </div>
        </div>
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
      <Badge variant={getStatusVariant(row.original.isActive, row.original.expiresAt)}>
        {getStatusText(row.original.isActive, row.original.expiresAt)}
      </Badge>
    ),
  },
  {
    header: 'Permissions',
    accessorKey: 'permissions',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <RiShieldLine className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.original.permissions.join(', ')}
        </span>
      </div>
    ),
  },
  {
    header: 'Usage',
    accessorKey: 'usageCount',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {row.original.usageCount} calls
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last used: {formatLastUsed(row.original.lastUsedAt)}
        </div>
      </div>
    ),
  },
  {
    header: 'Expires',
    accessorKey: 'expiresAt',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {row.original.expiresAt ? (
          <div>
            <div>{format(row.original.expiresAt, 'PP')}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {format(row.original.expiresAt, 'p')}
            </div>
          </div>
        ) : (
          <span>Never expires</span>
        )}
      </div>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    meta: {
      align: 'text-right',
    },
    cell: ({ row }) => (
      <div className="flex gap-2 justify-end">
        <form action="/api/developer/api-keys/delete" method="POST">
          <input type="hidden" name="apiKeyId" value={row.original.id} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
          >
            <RiDeleteBinLine className="h-4 w-4" />
          </Button>
        </form>
      </div>
    ),
  },
];

export { columns, type ApiKey };