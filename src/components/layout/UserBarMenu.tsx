import { type User } from '@prisma/client';

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
import { signOut } from '@/lib/auth';

export default function UserBarMenu({
  user,
}: {
  user?: User,
}) {
  if (!user) return (
    <Link href="/signin">
      <Button variant="secondary">
        Sign In
      </Button>
    </Link>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="p-1">
          <Avatar
            name={user.name || user.email}
            image={user.image}
            size="small"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {/* ----- Account ----- */}
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

        {/* ----- Admin ----- */}
        {user.role == 'ADMIN' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>
              <u>Admin</u>
            </DropdownMenuLabel>

            <DropdownMenuGroup>
              <Link href="/admin">
                <DropdownMenuItem>
                  Nodes
                </DropdownMenuItem>
              </Link>
              <Link href="/admin/users">
                <DropdownMenuItem>
                  Users
                </DropdownMenuItem>
              </Link>
              <Link href="/admin/organisations">
                <DropdownMenuItem>
                  Organisations
                </DropdownMenuItem>
              </Link>
              <Link href="/admin/teams">
                <DropdownMenuItem>
                  Teams
                </DropdownMenuItem>
              </Link>
              <Link href="/admin/projects">
                <DropdownMenuItem>
                  Projects
                </DropdownMenuItem>
              </Link>
              <Link href="/admin/previews/email">
                <DropdownMenuItem>
                  Preview email
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />

        <form
          action={async () => {
            'use server';
            await signOut({
              redirectTo: '/signin',
            });
          }}
        >
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
