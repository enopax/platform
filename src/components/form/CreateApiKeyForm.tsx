'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Callout } from '@/components/common/Callout';
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/common/Select';
import {
  RiAddLine,
  RiKeyLine,
  RiEyeLine,
  RiEyeOffLine,
  RiCheckLine,
  RiAlertLine
} from '@remixicon/react';
import { createApiKey, CreateApiKeyState } from '@/actions/api-key';

interface CreateApiKeyFormProps {
  userId: string;
}

const initialState: CreateApiKeyState = {};

export default function CreateApiKeyForm({ userId }: CreateApiKeyFormProps) {
  const [state, formAction, pending] = useActionState(createApiKey, initialState);
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="space-y-6">
      {/* Result Display */}
      {state.success && (
        <Callout
          variant="success"
          title="API Key Created Successfully!"
          icon={RiCheckLine}
        >
          <div>
            <p className="text-sm mb-3">
              Please copy and save this API key. You won't be able to see it again.
            </p>
            <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <RiKeyLine className="h-4 w-4" />
              <code className="flex-1 font-mono text-sm">
                {showApiKey ? state.apiKey : '••••••••••••••••••••••••••••••••'}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <RiEyeOffLine className="h-4 w-4" /> : <RiEyeLine className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(state.apiKey || '')}
              >
                Copy
              </Button>
            </div>
          </div>
        </Callout>
      )}

      {state.error && (
        <Callout
          variant="error"
          title="Failed to create API key"
          icon={RiAlertLine}
        >
          <p className="text-sm">
            {state.error}
          </p>
        </Callout>
      )}

      {/* Form */}
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">
            API Key Name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="e.g., My App Integration"
            required
            className="w-full"
            hasError={!!state.fieldErrors?.name}
          />
          {state.fieldErrors?.name && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {state.fieldErrors.name}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Choose a descriptive name to help you identify this key later.
          </p>
        </div>

        <div>
          <Label htmlFor="permissions">
            Permissions
          </Label>
          <Select name="permissions" required defaultValue="read">
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select permissions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">Read Only</SelectItem>
              <SelectItem value="write">Read & Write</SelectItem>
              <SelectItem value="admin">Full Access</SelectItem>
            </SelectContent>
          </Select>
          {state.fieldErrors?.permissions && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {state.fieldErrors.permissions}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Select the level of access this API key should have.
          </p>
        </div>

        <div>
          <Label htmlFor="expiresIn">
            Expiration
          </Label>
          <Select name="expiresIn" required defaultValue="30">
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select expiration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
              <SelectItem value="0">Never expires</SelectItem>
            </SelectContent>
          </Select>
          {state.fieldErrors?.expiresIn && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {state.fieldErrors.expiresIn}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Choose when this API key should expire for security.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2"
          >
            {pending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <RiAddLine className="h-4 w-4" />
            )}
            {pending ? 'Creating...' : 'Create API Key'}
          </Button>
        </div>
      </form>
    </div>
  );
}