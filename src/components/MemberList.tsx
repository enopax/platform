import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { RiUserLine } from '@remixicon/react';

interface Member {
  id: string;
  role: 'OWNER' | 'MANAGER' | 'MEMBER';
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    email: string;
    image: string | null;
  };
}

interface MemberListProps {
  members: Member[];
  title?: string;
  maxHeight?: string;
  showJoinDate?: boolean;
  compact?: boolean;
}

export default function MemberList({ 
  members, 
  title = "Members",
  maxHeight = "max-h-80",
  showJoinDate = false,
  compact = true
}: MemberListProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER': return 'default';
      case 'MANAGER': return 'secondary';
      case 'MEMBER': return 'outline';
      default: return 'outline';
    }
  };

  const getUserDisplayName = (user: Member['user']) => {
    if (user.name) return user.name;
    if (user.firstname && user.lastname) return `${user.firstname} ${user.lastname}`;
    if (user.firstname) return user.firstname;
    return user.email;
  };

  if (compact) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title} ({members.length})
        </h3>
        
        {members.length > 0 ? (
          <div className={`space-y-3 ${maxHeight} overflow-y-auto`}>
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  {member.user.image ? (
                    <img
                      src={member.user.image}
                      alt={member.user.name || 'User'}
                      className="w-6 h-6 rounded-full mr-2 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 mr-2 flex-shrink-0 flex items-center justify-center">
                      <RiUserLine className="w-3 h-3 text-gray-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {getUserDisplayName(member.user)}
                    </p>
                    {showJoinDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        Joined {new Date(member.joinedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(member.role)} className="ml-2 text-xs">
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <RiUserLine className="mx-auto h-6 w-6 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No members found
            </p>
          </div>
        )}
      </Card>
    );
  }

  // Non-compact version for full-width display
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title} ({members.length})
        </h2>
      </div>
      
      {members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex items-center">
                {member.user.image ? (
                  <img
                    src={member.user.image}
                    alt={member.user.name || 'User'}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 flex items-center justify-center">
                    <RiUserLine className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {getUserDisplayName(member.user)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {member.user.email}
                  </p>
                  {showJoinDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Joined {new Date(member.joinedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                  {member.role}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <RiUserLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No members found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Organization members will appear here.
          </p>
        </Card>
      )}
    </div>
  );
}