import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/common/Button';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { Divider } from '@/components/common/Divider';
import Table from '@/components/GenericTable';
import { columns as apiKeyColumns } from '@/components/table/ApiKey';
import {
  RiKeyLine,
  RiCodeLine,
  RiShieldLine,
  RiBookOpenLine
} from '@remixicon/react';
import Link from 'next/link';
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

  if (!session?.user?.id) {
    return null;
  }

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

  const activeKeys = apiKeys.filter(key => key.isActive && (!key.expiresAt || new Date() <= key.expiresAt)).length;
  const totalUsage = apiKeys.reduce((total, key) => total + key.usageCount, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-16">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Page Header */}
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Developer
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
          Manage your API keys and developer tools for programmatic access to the Enopax platform.
        </p>
      </section>

      {/* API Keys Overview - Definition List */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Overview
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <RiKeyLine className="size-4 text-green-600 dark:text-green-400" />
              Active Keys
            </dt>
            <dd className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">
              {activeKeys}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <RiCodeLine className="size-4 text-blue-600 dark:text-blue-400" />
              Total Requests
            </dt>
            <dd className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">
              {totalUsage}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <RiShieldLine className="size-4 text-purple-600 dark:text-purple-400" />
              Total Keys
            </dt>
            <dd className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">
              {totalApiKeys}
            </dd>
          </div>
        </dl>
      </section>

      <Divider />

      {/* Create API Key Section */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create New API Key
        </h2>
        <CreateApiKeyForm userId={session.user.id} />
      </section>

      <Divider />

      {/* API Keys Table Section */}
      {totalApiKeys > 0 ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your API Keys
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {totalApiKeys} total
            </span>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <Table
              pageNumber={pageNumber}
              tableSize={totalApiKeys}
              tableData={apiKeys}
              tableColumns={apiKeyColumns}
            />
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your API Keys
          </h2>
          <div className="text-center py-12 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30">
            <RiKeyLine className="mx-auto size-8 text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              No API keys yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              Create your first API key above to get started with programmatic access.
            </p>
          </div>
        </section>
      )}

      <Divider />

      {/* Documentation Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Getting Started
          </h2>
          <Link href="/api">
            <Button variant="secondary">
              <RiBookOpenLine className="mr-2 size-4" />
              Full Documentation
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
          Use your API keys to interact with the Enopax platform programmatically. Include your API key in the <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">Authorization</code> header.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Upload a file
            </h3>
            <pre className="bg-gray-950 dark:bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
              <code>curl -X POST https://api.enopax.io/v1/upload \<br/>
              &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" \<br/>
              &nbsp;&nbsp;-F "file=@example.txt"</code>
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              List files
            </h3>
            <pre className="bg-gray-950 dark:bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
              <code>curl -H "Authorization: Bearer YOUR_API_KEY" \<br/>
              &nbsp;&nbsp;https://api.enopax.io/v1/files</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}