import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import Container from '@/components/common/Container';
import { Divider } from '@/components/common/Divider';
import {
  RiCodeLine,
  RiKeyLine,
  RiUploadLine,
  RiServerLine,
  RiShieldLine,
  RiExternalLinkLine,
  RiFileCopyLine
} from '@remixicon/react';
import Link from 'next/link';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, any>>;
}

async function fetchOpenAPISpec(): Promise<OpenAPISpec | null> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/openapi.json`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch OpenAPI spec');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching OpenAPI spec:', error);
    return null;
  }
}

function getMethodColor(method: string) {
  const colors = {
    get: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    post: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    put: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    patch: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
}

function getCategoryIcon(tag: string) {
  const icons = {
    'Authentication': RiShieldLine,
    'Developer Tools': RiKeyLine,
    'File Management': RiUploadLine,
    'Infrastructure': RiServerLine,
    'Analytics': RiCodeLine,
    'General': RiCodeLine
  };

  return icons[tag as keyof typeof icons] || RiCodeLine;
}

export default async function APIDocsPage() {
  const spec = await fetchOpenAPISpec();

  if (!spec) {
    return (
      <Container>
        <div className="max-w-4xl mx-auto py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            API Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Unable to load API documentation at this time.
          </p>
        </div>
      </Container>
    );
  }

  // Group endpoints by tags
  const groupedEndpoints: Record<string, Array<{
    path: string;
    method: string;
    operation: any;
  }>> = {};

  Object.entries(spec.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const tag = operation.tags?.[0] || 'General';

      if (!groupedEndpoints[tag]) {
        groupedEndpoints[tag] = [];
      }

      groupedEndpoints[tag].push({
        path,
        method: method.toUpperCase(),
        operation
      });
    });
  });

  return (
    <Container>
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              API Documentation
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            {spec.info.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              Version {spec.info.version}
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              OpenAPI {spec.openapi}
            </Badge>
          </div>
        </div>

        {/* Base URLs */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <RiServerLine className="mr-2 h-5 w-5 text-brand-600" />
            Base URLs
          </h2>
          <div className="space-y-2">
            {spec.servers.map((server, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <code className="text-sm font-mono text-brand-600 dark:text-brand-400">
                    {server.url}
                  </code>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {server.description}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <RiFileCopyLine className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Authentication */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <RiKeyLine className="mr-2 h-5 w-5 text-brand-600" />
            Authentication
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Most endpoints require API key authentication in the Authorization header:
            </p>
            <code className="block text-sm font-mono bg-gray-800 dark:bg-gray-900 text-green-400 p-3 rounded">
              Authorization: Bearer YOUR_API_KEY
            </code>
          </div>
        </Card>

        {/* API Endpoints by Category */}
        <div className="space-y-8">
          {Object.entries(groupedEndpoints).map(([category, endpoints]) => {
            const Icon = getCategoryIcon(category);

            return (
              <Card key={category} className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Icon className="mr-3 h-6 w-6 text-brand-600" />
                  {category}
                </h2>

                <div className="space-y-4">
                  {endpoints.map(({ path, method, operation }, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge className={getMethodColor(method.toLowerCase())}>
                              {method}
                            </Badge>
                            <code className="text-sm font-mono text-gray-900 dark:text-white">
                              {path}
                            </code>
                          </div>
                          {operation.security && (
                            <Badge variant="outline" className="text-xs">
                              <RiKeyLine className="w-3 h-3 mr-1" />
                              Auth Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {operation.summary || operation.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        <Divider />

        {/* Footer */}
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Need API Keys?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create and manage your API keys from the developer dashboard
          </p>
          <Link href="/main/developer">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white">
              <RiKeyLine className="mr-2 h-4 w-4" />
              Manage API Keys
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}

export const metadata = {
  title: 'API Documentation - IPFS Storage',
  description: 'Complete API reference for IPFS Storage platform endpoints and authentication',
};