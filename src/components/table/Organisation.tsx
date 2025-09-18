'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Button } from '@/components/common/Button';
import { Tooltip } from '@/components/common/Tooltip';
import { type Organisation, type User } from '@prisma/client';
import Link from 'next/link';

type OrganisationWithOwner = Organisation & {
  owner: User;
  _count?: {
    members: number;
  };
};

const columns: ColumnDef<OrganisationWithOwner>[] = [
  {
    header: 'Organisation Name',
    accessorKey: 'name',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.logo && (
          <img 
            src={row.original.logo} 
            alt={row.original.name} 
            className="w-8 h-8 rounded mr-3 object-cover"
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
    header: 'Owner',
    accessorKey: 'owner',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => {
      const { owner } = row.original;
      const displayName = owner.name || (owner.firstname && owner.lastname ? `${owner.firstname} ${owner.lastname}` : owner.firstname || owner.lastname || owner.email);
      return (
        <div>
          <div className="font-medium">{displayName}</div>
          <div className="text-sm text-gray-500">{owner.email}</div>
        </div>
      );
    },
  },
  {
    header: 'Members',
    accessorKey: '_count.members',
    meta: {
      align: 'text-center',
    },
    cell: ({ row }) => (
      <span className="inline-flex items-center justify-center w-8 h-6 text-sm font-medium bg-gray-100 rounded-full">
        {row.original._count?.members || 0}
      </span>
    ),
  },
  {
    header: 'Contact',
    accessorKey: 'contact',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.email && (
          <div className="text-gray-900">{row.original.email}</div>
        )}
        {row.original.phone && (
          <div className="text-gray-500">{row.original.phone}</div>
        )}
        {row.original.website && (
          <div className="text-blue-600">
            <a href={row.original.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
              Website
            </a>
          </div>
        )}
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
      new Date(row.original.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
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
        <Tooltip content="Edit Organisation" asChild>
          <Link href={`/admin/organisation/${row.original.id}`}>
            <Button
              type="button"
              variant="light"
              size="sm"
            >
              Edit
            </Button>
          </Link>
        </Tooltip>
        <Tooltip content="Delete Organisation" asChild>
          <Button
            type="button"
            variant="light"
            size="sm"
            //onClick={() => deleteOrganisation(row.original.id)}
          >
            Delete
          </Button>
        </Tooltip>
      </span>
    ),
  },
];

export { columns, type OrganisationWithOwner };