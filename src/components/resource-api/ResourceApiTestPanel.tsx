'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { TextInput } from '@/components/common/TextInput';
import {
  RiCheckLine,
  RiCloseLine,
  RiRefreshLine,
  RiAddLine,
  RiDeleteBin6Line,
  RiSearchLine,
} from '@remixicon/react';

interface ResourceApiTestPanelProps {
  organisationName: string;
  projects: Array<{ id: string; name: string }>;
  userId: string;
}

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export default function ResourceApiTestPanel({
  organisationName,
  projects,
  userId,
}: ResourceApiTestPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [discoverResult, setDiscoverResult] = useState<TestResult | null>(null);
  const [provisionResult, setProvisionResult] = useState<TestResult | null>(null);
  const [statusResult, setStatusResult] = useState<TestResult | null>(null);
  const [listResult, setListResult] = useState<TestResult | null>(null);
  const [deleteResult, setDeleteResult] = useState<TestResult | null>(null);

  const [resourceName, setResourceName] = useState('test-resource');
  const [selectedProject, setSelectedProject] = useState(projects[0]?.name || 'Test Project');
  const [resourceId, setResourceId] = useState('');
  const [provider, setProvider] = useState('example');

  const handleDiscover = async () => {
    setIsLoading(true);
    setDiscoverResult(null);
    try {
      const response = await fetch('/api/test-resource-api?action=discover');
      const data = await response.json();
      setDiscoverResult({
        success: data.success || response.ok,
        data: data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setDiscoverResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProvision = async () => {
    setIsLoading(true);
    setProvisionResult(null);
    try {
      const response = await fetch(`/api/test-resource-api?action=provision&provider=${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: resourceName,
          organisationName: organisationName,
          projectName: selectedProject,
          userId: userId,
          sshKeys: [],
        }),
      });
      const data = await response.json();
      setProvisionResult({
        success: data.success || response.ok,
        data: data,
        timestamp: new Date().toISOString(),
      });

      if (data.success && data.data?.id) {
        setResourceId(data.data.id);
      }
    } catch (error) {
      setProvisionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStatus = async () => {
    if (!resourceId) {
      setStatusResult({
        success: false,
        error: 'Please enter a resource ID',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    setIsLoading(true);
    setStatusResult(null);
    try {
      const response = await fetch(
        `/api/test-resource-api?action=status&provider=${provider}&resourceId=${encodeURIComponent(resourceId)}`
      );
      const data = await response.json();
      setStatusResult({
        success: data.success || response.ok,
        data: data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setStatusResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleListResources = async () => {
    setIsLoading(true);
    setListResult(null);
    try {
      const response = await fetch(
        `/api/test-resource-api?action=list&provider=${provider}&org=${encodeURIComponent(organisationName)}&project=${encodeURIComponent(selectedProject)}`
      );
      const data = await response.json();
      setListResult({
        success: data.success || response.ok,
        data: data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setListResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!resourceId) {
      setDeleteResult({
        success: false,
        error: 'Please enter a resource ID',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    setIsLoading(true);
    setDeleteResult(null);
    try {
      const response = await fetch(
        `/api/test-resource-api?provider=${provider}&resourceId=${encodeURIComponent(resourceId)}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      setDeleteResult({
        success: data.success || response.ok,
        data: data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setDeleteResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = (result: TestResult | null, title: string) => {
    if (!result) return null;

    return (
      <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-2 mb-2">
          {result.success ? (
            <RiCheckLine className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <RiCloseLine className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto mt-2">
          {JSON.stringify(result.data || { error: result.error }, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider
          </label>
          <TextInput
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="example"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resource Name
          </label>
          <TextInput
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            placeholder="test-resource"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resource ID (for status/delete)
          </label>
          <TextInput
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            placeholder="Enter resource ID"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">1. Discover Providers</h3>
          <p className="text-sm text-gray-600 mb-3">
            Fetch available providers from the Resource API (public endpoint).
          </p>
          <Button
            onClick={handleDiscover}
            disabled={isLoading}
            variant="outline"
          >
            <RiSearchLine className="w-4 h-4 mr-2" />
            Discover Providers
          </Button>
          {renderResult(discoverResult, 'Discovery Result')}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">2. Provision Resource</h3>
          <p className="text-sm text-gray-600 mb-3">
            Create a new test resource via the Resource API.
          </p>
          <Button
            onClick={handleProvision}
            disabled={isLoading}
            variant="primary"
          >
            <RiAddLine className="w-4 h-4 mr-2" />
            Provision Resource
          </Button>
          {renderResult(provisionResult, 'Provision Result')}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">3. Get Resource Status</h3>
          <p className="text-sm text-gray-600 mb-3">
            Check the status of a specific resource by ID.
          </p>
          <Button
            onClick={handleGetStatus}
            disabled={isLoading || !resourceId}
            variant="outline"
          >
            <RiRefreshLine className="w-4 h-4 mr-2" />
            Get Status
          </Button>
          {renderResult(statusResult, 'Status Result')}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">4. List Resources</h3>
          <p className="text-sm text-gray-600 mb-3">
            List all resources for the selected organisation and project.
          </p>
          <Button
            onClick={handleListResources}
            disabled={isLoading}
            variant="outline"
          >
            <RiSearchLine className="w-4 h-4 mr-2" />
            List Resources
          </Button>
          {renderResult(listResult, 'List Result')}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">5. Delete Resource</h3>
          <p className="text-sm text-gray-600 mb-3">
            Deprovision and delete a test resource by ID.
          </p>
          <Button
            onClick={handleDelete}
            disabled={isLoading || !resourceId}
            variant="destructive"
          >
            <RiDeleteBin6Line className="w-4 h-4 mr-2" />
            Delete Resource
          </Button>
          {renderResult(deleteResult, 'Delete Result')}
        </div>
      </div>
    </div>
  );
}
