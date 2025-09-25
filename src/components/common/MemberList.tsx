'use client';

import { Badge } from '@/components/common/Badge';
import { RiUserLine } from '@remixicon/react';

interface Member {
  id: string;
  user: {
    id: string;
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    email: string;
  };
  role: string;
  joinedAt: Date;
}

interface MemberListProps {
  members: Member[];
  className?: string;
}

export default function MemberList({ members, className = '' }: MemberListProps) {
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'OWNER': return 'default';
      case 'MANAGER': return 'secondary';
      case 'MEMBER': return 'neutral';
      default: return 'neutral';
    }
  };

  if (members.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <RiUserLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-300">No members found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <RiUserLine className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {member.user.name || `${member.user.firstname || ''} ${member.user.lastname || ''}`.trim() || member.user.email}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {member.user.email}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getRoleVariant(member.role)} className="text-xs">
              {member.role}
            </Badge>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Joined {new Date(member.joinedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}