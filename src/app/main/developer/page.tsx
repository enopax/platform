import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import Table from '@/components/GenericTable';
import { columns as apiKeyColumns } from '@/components/table/ApiKey';
import {
  RiKeyLine,
  RiAddLine,
  RiCodeLine,
  RiShieldLine
} from '@remixicon/react';
import CreateApiKeyForm from '@/components/form/CreateApiKeyForm';

export default async function DeveloperPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>,
}) {
  const size = 20;
  const { page = '1' } = await searchParams;
  const pageNumber = Number(page);
  const session = await auth();
  if (!session) return null;

  // Get user's API keys with pagination
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: (pageNumber - 1) * size,
    take: size,
  });

  const totalApiKeys = await prisma.apiKey.count({
    where: {
      userId: session.user.id,
    },
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Developer
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your API keys and developer tools for programmatic access.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active API Keys
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalApiKeys > 0 ? apiKeys.filter(key => key.isActive && (!key.expiresAt || new Date() <= key.expiresAt)).length : 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <RiKeyLine className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Usage
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalApiKeys > 0 ? apiKeys.reduce((total, key) => total + key.usageCount, 0) : 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <RiCodeLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Keys
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalApiKeys}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <RiShieldLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Create API Key Section */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Create New API Key
        </h3>
        <CreateApiKeyForm userId={session.user.id} />
      </Card>

      {/* API Keys Table */}
      {totalApiKeys > 0 ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Your API Keys ({totalApiKeys})
          </h2>
          <Card className="overflow-hidden">
            <Table
              pageNumber={pageNumber}
              tableSize={totalApiKeys}
              tableData={apiKeys}
              tableColumns={apiKeyColumns}
              tableMeta={{}}
            />
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center mb-8">
          <RiKeyLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No API keys yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first API key to get started with programmatic access.
          </p>
        </Card>
      )}

      {/* Documentation Section */}
      <Card className="p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Getting Started
        </h3>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Use your API keys to interact with our storage API programmatically. Here are some examples:
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Upload a file</h4>
            <code className="text-sm text-gray-700 dark:text-gray-300">
              curl -X POST https://api.example.com/v1/upload \<br/>
              &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" \<br/>
              &nbsp;&nbsp;-F "file=@example.txt"
            </code>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">List files</h4>
            <code className="text-sm text-gray-700 dark:text-gray-300">
              curl -H "Authorization: Bearer YOUR_API_KEY" \<br/>
              &nbsp;&nbsp;https://api.example.com/v1/files
            </code>
          </div>
        </div>
      </Card>
    </div>
  );
}