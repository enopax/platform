'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Button } from '@/components/common/Button';
import { Tooltip } from '@/components/common/Tooltip';
import { type User } from '@prisma/client';
import Link from 'next/link';

const columns: ColumnDef<User>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => {
      const { firstname, lastname, name } = row.original;
      const displayName = name || (firstname && lastname ? `${firstname} ${lastname}` : firstname || lastname);
      return displayName || '-';
    },
  },
  {
    header: 'Email',
    accessorKey: 'email',
    meta: {
      align: 'text-left',
    },
  },
  {
    header: 'Role',
    accessorKey: 'role',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        row.original.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
        row.original.role === 'NOMAD' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {row.original.role}
      </span>
    ),
  },
  {
    header: 'Email Verified',
    accessorKey: 'emailVerified',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      row.original.emailVerified ? format(new Date(row.original.emailVerified), 'd MMM yyyy') : 'Not Verified'
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
        <Tooltip content="Edit User" asChild>
          <Link href={`/admin/user/${row.original.id}`}>
            <Button
              type="button"
              variant="light"
              size="sm"
            >
              Edit
            </Button>
          </Link>
        </Tooltip>
        <Tooltip content="Delete User" asChild>
          <Button
            type="button"
            variant="light"
            size="sm"
            //onClick={() => deleteUser(row.original.id)}
          >
            Delete
          </Button>
        </Tooltip>
      </span>
    ),
  },
];

export { columns };
