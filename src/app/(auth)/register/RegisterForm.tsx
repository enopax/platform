'use client';

import { useActionState } from 'react';
import { register, type RegisterState } from '@/actions/register';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import Link from 'next/link';

const initialState: RegisterState = {};

interface RegisterFormProps {
  prefilledEmail?: string;
  inviteToken?: string;
  organisationName?: string;
  invitedRole?: string;
}

export default function RegisterForm({ prefilledEmail, inviteToken, organisationName, invitedRole }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(register, initialState);

  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <Card className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-300">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {organisationName ? (
                <>
                  Complete your account to join <strong>{organisationName}</strong>
                  {invitedRole ? ` as ${invitedRole}` : ''}.
                </>
              ) : (
                'Sign up to get started with Enopax'
              )}
            </p>
          </div>

          {state.error && !state.fieldErrors && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                pattern="[a-z0-9-]+"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-username"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Lowercase letters, numbers, and hyphens. This is your URL: enopax.com/<strong>username</strong></p>
              {state.fieldErrors?.username && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name <span className="text-gray-400 dark:text-gray-500">(optional)</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="How you want to be known"
              />
              {state.fieldErrors?.name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={prefilledEmail}
                readOnly={!!prefilledEmail}
                className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 ${
                  prefilledEmail ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
                } px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="you@example.com"
              />
              {prefilledEmail && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pre-filled from your invitation.</p>
              )}
              {state.fieldErrors?.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="At least 8 characters"
              />
              {state.fieldErrors?.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                id="password2"
                name="password2"
                type="password"
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repeat password"
              />
              {state.fieldErrors?.password2 && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.password2}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href={inviteToken ? `/signin?callbackUrl=${encodeURIComponent(`/accept-invite?token=${inviteToken}`)}` : '/signin'}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
