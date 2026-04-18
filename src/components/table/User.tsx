'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Tooltip } from '@/components/common/Tooltip';
import { type User } from '@/lib/store';
import { activateUser } from '@/actions/user';
import Link from 'next/link';

function ActivateButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleActivate = () => {
    startTransition(async () => {
      await activateUser(userId);
      router.refresh();
    });
  };

  return (
    <Button type="button" variant="primary" size="sm" onClick={handleActivate} disabled={isPending}>
      {isPending ? 'Activating…' : 'Activate'}
    </Button>
  );
}

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
        row.original.role === 'SUPERADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
        row.original.role === 'GUEST' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      }`}>
        {row.original.role === 'GUEST' ? 'Early Access' : row.original.role}
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
        {row.original.role === 'GUEST' && (
          <ActivateButton userId={row.original.id} />
        )}
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
      </span>
    ),
  },
];

export { columns };
