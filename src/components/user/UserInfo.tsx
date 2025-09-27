'use client'

import { type User } from '@prisma/client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/Popover';
import UserListItem from '@/components/list/UserListItem';

export default function UserInfo({ user }: { user: User }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="text-emerald-500 hover:underline cursor-pointer">
          {user.name}
        </span>
      </PopoverTrigger>
      <PopoverContent className="p-4 max-w-sm outline-none focus:ring-0">
        <UserListItem
          user={user}
          request={user.available}
        />
      </PopoverContent>
    </Popover>
  );
}
