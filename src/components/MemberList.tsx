'use client';

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface MemberListProps {
  members: Member[];
  onRemoveMember?: (memberId: string) => void;
  onChangeRole?: (memberId: string, role: string) => void;
}

export default function MemberList({ members, onRemoveMember, onChangeRole }: MemberListProps) {
  return (
    <div className="space-y-3">
      {members.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No members found</p>
      ) : (
        members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{member.name || 'Unnamed User'}</p>
              <p className="text-sm text-gray-600">{member.email}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                {member.role}
              </span>
              {onChangeRole && (
                <select
                  value={member.role}
                  onChange={(e) => onChangeRole(member.id, e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="MEMBER">Member</option>
                  <option value="LEAD">Lead</option>
                  <option value="ADMIN">Admin</option>
                </select>
              )}
              {onRemoveMember && (
                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}