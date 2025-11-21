'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';

interface TestResult {
  success: boolean;
  data?: unknown;
  error?: string;
  hint?: string;
  timestamp: string;
}

interface ProviderInfo {
  name: string;
  displayName: string;
  description: string;
  version: string;
}

export function ResourceApiDebugPanel() {
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(
    null
  );
  const [provisionResult, setProvisionResult] = useState<TestResult | null>(
    null
  );
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingProvision, setIsTestingProvision] = useState(false);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [showProvisionDetails, setShowProvisionDetails] = useState(false);

  const apiUrl =
    process.env.NEXT_PUBLIC_RESOURCE_API_URL || 'http://localhost:3001';

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      const response = await fetch('/api/debug/resource-api?action=discover');
      const result = await response.json();

      setConnectionResult({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setConnectionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testProvision = async () => {
    setIsTestingProvision(true);
    setProvisionResult(null);

    try {
      const testResourceData = {
        name: `test-resource-${Date.now()}`,
        organisationName: 'test-org',
        projectName: 'test-project',
        userId: 'test-user',
        sshKeys: [],
      };

      const response = await fetch('/api/debug/resource-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'example',
          resourceData: testResourceData,
        }),
      });

      const result = await response.json();

      setProvisionResult({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setProvisionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTestingProvision(false);
    }
  };

  const getStatusDot = (success?: boolean) => {
    if (success === undefined) return <span className="text-gray-400">○</span>;
    return success ? (
      <span className="text-green-500">●</span>
    ) : (
      <span className="text-red-500">●</span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Resource API Connection Test
        </h1>
        <p className="text-gray-600">
          Debug and test Platform ↔ Resource API communication
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-600">API URL</div>
            <div className="text-lg font-mono">{apiUrl}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-600">Status</div>
            <div className="text-lg">
              {getStatusDot(connectionResult?.success)}{' '}
              {connectionResult === null
                ? 'Not tested'
                : connectionResult.success
                  ? 'Connected'
                  : 'Disconnected'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={testConnection}
          disabled={isTestingConnection}
          variant="primary"
          className="flex-1"
        >
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button
          onClick={testProvision}
          disabled={isTestingProvision}
          variant="secondary"
          className="flex-1"
        >
          {isTestingProvision ? 'Testing...' : 'Test Provision'}
        </Button>
      </div>

      {connectionResult && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Connection Test Results</h2>
              <button
                onClick={() => setShowConnectionDetails(!showConnectionDetails)}
                className="text-sm text-blue-600 hover:underline"
              >
                {showConnectionDetails ? 'Hide details' : 'Show details'}
              </button>
            </div>

            {connectionResult.success ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Provider discovery successful</span>
                </div>
                {connectionResult.data &&
                  Array.isArray(connectionResult.data) && (
                    <div className="text-sm text-gray-600">
                      Found {connectionResult.data.length} provider
                      {connectionResult.data.length !== 1 ? 's' : ''}:{' '}
                      {connectionResult.data
                        .map((p: ProviderInfo) => p.displayName)
                        .join(', ')}
                    </div>
                  )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  <span className="text-red-600">Connection failed</span>
                </div>
                <div className="text-sm text-red-600">
                  {connectionResult.error}
                </div>
                {connectionResult.hint && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <strong>Hint:</strong> {connectionResult.hint}
                  </div>
                )}
              </div>
            )}

            {showConnectionDetails && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Response Data
                </div>
                <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(connectionResult, null, 2)}
                </pre>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Tested at: {new Date(connectionResult.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {provisionResult && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Provision Test Results</h2>
              <button
                onClick={() => setShowProvisionDetails(!showProvisionDetails)}
                className="text-sm text-blue-600 hover:underline"
              >
                {showProvisionDetails ? 'Hide details' : 'Show details'}
              </button>
            </div>

            {provisionResult.success ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Resource provision successful</span>
                </div>
                {provisionResult.data && (
                  <div className="text-sm text-gray-600">
                    <div>
                      Resource ID:{' '}
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {(provisionResult.data as { id?: string }).id ||
                          'N/A'}
                      </code>
                    </div>
                    <div>
                      Status:{' '}
                      {(provisionResult.data as { status?: string }).status ||
                        'N/A'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  <span className="text-red-600">Provision failed</span>
                </div>
                <div className="text-sm text-red-600">
                  {provisionResult.error}
                </div>
                {provisionResult.hint && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <strong>Hint:</strong> {provisionResult.hint}
                  </div>
                )}
              </div>
            )}

            {showProvisionDetails && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Response Data
                </div>
                <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(provisionResult, null, 2)}
                </pre>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Tested at: {new Date(provisionResult.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">Quick Start Guide</h3>
        <div className="text-sm space-y-2">
          <div>
            <strong>1. Test Connection:</strong> Verifies Platform can reach
            Resource API and discover providers
          </div>
          <div>
            <strong>2. Test Provision:</strong> Creates a test resource to verify
            end-to-end flow
          </div>
          <div className="mt-4 p-3 bg-white rounded border border-blue-200">
            <div className="font-medium mb-1">
              If Resource API is not running:
            </div>
            <code className="text-xs">
              cd resource-api && pnpm dev
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
