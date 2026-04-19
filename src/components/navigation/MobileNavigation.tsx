'use client';

import Link from 'next/link';
import {
  RiBuildingLine,
  RiUserLine,
  RiMenuLine,
} from '@remixicon/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/menu/DropdownMenu';

interface MobileNavigationProps {
  user?: any;
}

export default function MobileNavigation({ user }: MobileNavigationProps) {
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          aria-label="Menu"
        >
          <RiMenuLine className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Navigation</DropdownMenuLabel>

        <DropdownMenuGroup>
          <Link href="/orga">
            <DropdownMenuItem>
              <RiBuildingLine className="mr-2 h-4 w-4" />
              Organisations
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        {user?.role === 'SUPERADMIN' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Admin</DropdownMenuLabel>

            <DropdownMenuGroup>
              <Link href="/admin/users">
                <DropdownMenuItem>
                  <RiUserLine className="mr-2 h-4 w-4" />
                  Users
                </DropdownMenuItem>
              </Link>
              <Link href="/admin/organisations">
                <DropdownMenuItem>
                  <RiBuildingLine className="mr-2 h-4 w-4" />
                  Organisations
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
