'use client';

import Link from 'next/link';
import { Button } from '@/components/common/Button';
import Avatar from '@/components/common/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/menu/DropdownMenu';
import { handleSignOut } from '@/actions/auth';

export default function UserBarMenu({
  user,
}: {
  user?: any,
}) {
  if (!user) return (
    <Link href="/signin">
      <Button variant="secondary" className="text-sm">
        Sign In
      </Button>
    </Link>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex" aria-label="User menu">
          <Avatar
            name={user.name || user.email}
            image={user.image}
            size="small"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <u>Main</u>
        </DropdownMenuLabel>

        <DropdownMenuGroup>
          <Link href="/orga">
            <DropdownMenuItem>
              Organisations
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        <DropdownMenuLabel>
          <u>Account</u>
        </DropdownMenuLabel>

        <DropdownMenuGroup>
          <Link href="/account/developer">
            <DropdownMenuItem>
              Developer
            </DropdownMenuItem>
          </Link>
          <Link href="/account/settings">
            <DropdownMenuItem>
              Settings
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        {user.role === 'SUPERADMIN' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>
              <u>Admin</u>
            </DropdownMenuLabel>

            <DropdownMenuGroup>
              <Link href="/admin/users">
                <DropdownMenuItem>Users</DropdownMenuItem>
              </Link>
              <Link href="/admin/organisations">
                <DropdownMenuItem>Organisations</DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />

        <form action={handleSignOut}>
          <button className="w-full">
            <DropdownMenuItem className="text-red-500">
              Sign Out
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
