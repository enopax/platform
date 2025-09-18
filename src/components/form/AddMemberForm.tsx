'use client';

import { useActionState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { addTeamMember, type AddTeamMemberState } from '@/actions/teamMember';
import { RiUserAddLine, RiCheckLine } from '@remixicon/react';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  name?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
}

interface AddMemberFormProps {
  teamId: string;
  availableUsers: User[];
}

export default function AddMemberForm({ teamId, availableUsers }: AddMemberFormProps) {
  const [state, formAction, isPending] = useActionState<AddTeamMemberState, FormData>(
    (prevState, formData) => addTeamMember(teamId, prevState, formData),
    {}
  );
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('MEMBER');

  // Reset form on success and refresh page
  useEffect(() => {
    if (state.success) {
      setSelectedUserId('');
      setSelectedRole('MEMBER');
      // Refresh the page to show updated member list
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [state.success]);

  const getUserDisplayName = (user: User) => {
    if (user.name) return user.name;
    if (user.firstname && user.lastname) return `${user.firstname} ${user.lastname}`;
    if (user.firstname) return user.firstname;
    return user.email;
  };

  return (
    <form action={formAction} className="space-y-6">
      {/* Success Message */}
      {state.success && (
        <Callout variant="success" className="mb-4">
          <RiCheckLine className="h-4 w-4" />
          Team member added successfully!
        </Callout>
      )}

      {/* Error Message */}
      {state.error && (
        <Callout variant="destructive">
          {state.error}
        </Callout>
      )}

      {/* User Selection */}
      <div>
        <Label htmlFor="userId">
          Select User ({availableUsers.length} available)
        </Label>
        <Select name="userId" value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="mt-1" hasError={!!state.fieldErrors?.userId}>
            <SelectValue placeholder="Choose a user to add..." />
          </SelectTrigger>
          <SelectContent>
            {availableUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {getUserDisplayName(user)} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Available organization members who are not yet on this team
        </p>
        {state.fieldErrors?.userId && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {state.fieldErrors.userId}
          </p>
        )}
      </div>

      {/* Role Selection */}
      <div>
        <Label htmlFor="role">
          Role
        </Label>
        <Select name="role" value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="mt-1" hasError={!!state.fieldErrors?.role}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER">Member</SelectItem>
            <SelectItem value="LEAD">Team Lead</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Team leads can help manage team members and settings
        </p>
        {state.fieldErrors?.role && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {state.fieldErrors.role}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending || !selectedUserId}
          isLoading={isPending}
        >
          <RiUserAddLine className="w-4 h-4 mr-2" />
          {isPending ? 'Adding...' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
}