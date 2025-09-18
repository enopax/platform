'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Callout } from '@/components/common/Callout';
import {
  RiAddLine,
  RiKeyLine,
  RiEyeLine,
  RiEyeOffLine,
  RiCheckLine,
  RiAlertLine
} from '@remixicon/react';

interface CreateApiKeyFormProps {
  userId: string;
}

interface ApiKeyResult {
  success: boolean;
  apiKey?: string;
  error?: string;
}

export default function CreateApiKeyForm({ userId }: CreateApiKeyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiKeyResult | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    permissions: 'read',
    expiresIn: '30',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/developer/api-keys/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: formData.name,
          permissions: [formData.permissions],
          expiresIn: formData.expiresIn ? parseInt(formData.expiresIn) : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, apiKey: data.apiKey });
        setFormData({ name: '', permissions: 'read', expiresIn: '30' });
      } else {
        setResult({ success: false, error: data.error || 'Failed to create API key' });
      }
    } catch (error) {
      setResult({ success: false, error: 'Network error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Result Display */}
      {result && (
        <Callout
          variant={result.success ? 'success' : 'error'}
          title={result.success ? 'API Key Created Successfully!' : 'Failed to create API key'}
          icon={result.success ? RiCheckLine : RiAlertLine}
        >
          {result.success ? (
            <div>
              <p className="text-sm mb-3">
                Please copy and save this API key. You won't be able to see it again.
              </p>
              <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <RiKeyLine className="h-4 w-4" />
                <code className="flex-1 font-mono text-sm">
                  {showApiKey ? result.apiKey : '••••••••••••••••••••••••••••••••'}
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
                  onClick={() => navigator.clipboard.writeText(result.apiKey || '')}
                >
                  Copy
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm">
              {result.error}
            </p>
          )}
        </Callout>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Key Name
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., My App Integration"
            required
            className="w-full"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Choose a descriptive name to help you identify this key later.
          </p>
        </div>

        <div>
          <label htmlFor="permissions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Permissions
          </label>
          <Select
            value={formData.permissions}
            onValueChange={(value) => handleInputChange('permissions', value)}
          >
            <option value="read">Read Only</option>
            <option value="write">Read & Write</option>
            <option value="admin">Full Access</option>
          </Select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Select the level of access this API key should have.
          </p>
        </div>

        <div>
          <label htmlFor="expiresIn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expiration
          </label>
          <Select
            value={formData.expiresIn}
            onValueChange={(value) => handleInputChange('expiresIn', value)}
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
            <option value="">Never expires</option>
          </Select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Choose when this API key should expire for security.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading || !formData.name.trim()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <RiAddLine className="h-4 w-4" />
            )}
            {isLoading ? 'Creating...' : 'Create API Key'}
          </Button>
        </div>
      </form>
    </div>
  );
}