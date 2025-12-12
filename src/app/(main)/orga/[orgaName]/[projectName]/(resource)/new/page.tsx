'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import {
  RiAddLine,
  RiServerLine,
  RiProjectorLine
} from '@remixicon/react';
import { useRouter } from 'next/navigation';
import CreateResourceForm from '@/components/form/CreateResourceForm';
import { useOrganisation } from '@/contexts/OrganisationContext';
import { useProject } from '@/contexts/ProjectContext';

export default function AddResourcePage() {
  const router = useRouter();
  const organisation = useOrganisation();
  const project = useProject();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch session data
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setSession(sessionData);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="mb-8">
          <div className="h-8 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <Card className="p-8">
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </Card>
      </div>
    );
  }

  if (!session || !session.user?.id) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Please sign in to continue.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Organisations', href: '/orga/organisations' },
            { label: organisation.name, href: `/orga/${organisation.name}` },
            { label: 'Projects', href: `/orga/${organisation.name}/projects` },
            { label: project.name, href: `/orga/${organisation.name}/${project.name}` },
            { label: 'Add Resource' }
          ]}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
            <RiServerLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Add Resource to {project.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create a new resource that will be assigned to this project
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content - Resource Creation Form */}
        <div className="xl:col-span-3">
          <Card>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                  <RiAddLine className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Create New Resource
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Configure your new resource
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <CreateResourceForm
                currentUserId={session.user.id}
                projectId={project.id}
                projectName={project.name}
                organisationName={organisation.name}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar - Project Overview */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                <RiProjectorLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Project Details
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Project Name:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {project.name}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Organisation:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {organisation.name}
                </span>
              </div>

              {project.description && (
                <div>
                  <span className="text-gray-500">Description:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                    {project.description}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
