'use client';

import { useActionState } from 'react';
import { updateUserAdmin, type UpdateUserState } from '@/actions/user';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Callout } from '@/components/common/Callout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import ClientDate from '@/components/common/ClientDate';
import { type User } from '@prisma/client';
import { RiCheckLine, RiErrorWarningLine } from '@remixicon/react';
import Link from 'next/link';

interface UpdateUserFormProps {
  user: User;
}

const initialState: UpdateUserState = {
  success: false,
  error: undefined,
  fieldErrors: undefined,
};

export default function UpdateUserForm({ user }: UpdateUserFormProps) {
  const updateUserWithId = updateUserAdmin.bind(null, user.id);
  const [state, formAction, isPending] = useActionState(updateUserWithId, initialState);

  return (
    <form action={formAction} className="space-y-6">

      {state.error && (
        <Callout
          title="Update Failed"
          variant="error"
          icon={RiErrorWarningLine}
        >
          {state.error}
        </Callout>
      )}

      {state.success && (
        <Callout
          title="Success"
          variant="success"
          icon={RiCheckLine}
        >
          User updated successfully!
        </Callout>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="firstname">
            First Name
          </Label>
          <Input
            type="text"
            id="firstname"
            name="firstname"
            defaultValue={user.firstname || ''}
            hasError={!!state.fieldErrors?.firstname}
            className="mt-1"
          />
          {state.fieldErrors?.firstname && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.firstname}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lastname">
            Last Name
          </Label>
          <Input
            type="text"
            id="lastname"
            name="lastname"
            defaultValue={user.lastname || ''}
            hasError={!!state.fieldErrors?.lastname}
            className="mt-1"
          />
          {state.fieldErrors?.lastname && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.lastname}</p>
          )}
        </div>

        <div>
          <Label htmlFor="name">
            Display Name
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            defaultValue={user.name || ''}
            hasError={!!state.fieldErrors?.name}
            className="mt-1"
          />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">
            Email Address *
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            defaultValue={user.email}
            required
            hasError={!!state.fieldErrors?.email}
            className="mt-1"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="role">
            Role *
          </Label>
          <Select name="role" defaultValue={user.role} required>
            <SelectTrigger className="mt-1" hasError={!!state.fieldErrors?.role}>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GUEST">Guest</SelectItem>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          {state.fieldErrors?.role && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.role}</p>
          )}
        </div>

        <div>
          <Label>
            Email Verified
          </Label>
          <p className="mt-1 text-sm text-gray-500">
            {user.emailVerified 
              ? <ClientDate date={user.emailVerified} format="short" />
              : 'Not verified'
            }
          </p>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div>
            <strong>Created:</strong> <ClientDate date={user.createdAt} format="time" />
          </div>
          <div>
            <strong>Updated:</strong> <ClientDate date={user.updatedAt} format="time" />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Updating...' : 'Update User'}
        </Button>
      </div>
    </form>
  );
}