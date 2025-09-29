'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { ProjectBreadcrumbs } from '@/components/common/Breadcrumbs';
import { Button } from '@/components/common/Button';
import ResourceWizard from '@/components/resource/ResourceWizard';
import {
  RiAddLine,
  RiServerLine,
  RiProjectorLine,
  RiToggleLine,
  RiSettings3Line
} from '@remixicon/react';
import { useRouter } from 'next/navigation';
import CreateResourceForm from '@/components/form/CreateResourceForm';

interface AddResourcePageProps {
  params: Promise<{ id: string }>;
}

// This component fetches data on the client side for better UX
export default function AddResourcePage({ params }: AddResourcePageProps) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [useWizard, setUseWizard] = useState(true);
  const [userTeams, setUserTeams] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const { id } = await params;

        // Fetch project data
        const projectResponse = await fetch(`/api/project/${id}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          setProject(projectData.project);
        } else {
          console.error('Failed to fetch project:', projectResponse.status, projectResponse.statusText);
        }

        // Fetch session data (simplified - you'll need to implement this)
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setSession(sessionData);
        }

        // Fetch user teams
        const teamsResponse = await fetch('/api/team/list');
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setUserTeams(teamsData.teams || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params]);

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

  if (!project || !session || !session.user?.id) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {!project ? 'Project Not Found' : 'Authentication Required'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {!project
              ? "The project you're looking for doesn't exist or you don't have access to it."
              : "Please sign in to continue."
            }
          </p>
        </Card>
      </div>
    );
  }

  const handleWizardComplete = (resourceData: any) => {
    // Handle resource creation
    console.log('Creating resource:', resourceData);
    // You'll need to implement the actual resource creation logic here
    router.push(`/main/projects/${project.id}`);
  };

  const handleCancel = () => {
    router.push(`/main/projects/${project.id}`);
  };

  // Remove the server-side data fetching - now handled in useEffect

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <ProjectBreadcrumbs
          projectName={project.name}
          projectId={project.id}
          currentPage="Add Resource"
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                <RiServerLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Add Resource to {project.name}
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {useWizard
                ? 'Follow our guided wizard to create the perfect resource for your project'
                : 'Create a new resource that will be automatically assigned to this project'
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setUseWizard(!useWizard)}
              className="flex items-center"
            >
              {useWizard ? (
                <>
                  <RiSettings3Line className="w-4 h-4 mr-2" />
                  Advanced Mode
                </>
              ) : (
                <>
                  <RiToggleLine className="w-4 h-4 mr-2" />
                  Guided Wizard
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {useWizard ? (
        <ResourceWizard
          projectId={project.id}
          projectName={project.name}
          currentUserId={session.user.id}
          onCancel={handleCancel}
          onComplete={handleWizardComplete}
        />
      ) : (
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
                      Configure your new resource for this project
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <CreateResourceForm
                  currentUserId={session.user.id}
                  projectId={project.id}
                  projectName={project.name}
                  teams={userTeams}
                />
              </div>
            </Card>
          </div>

          {/* Sidebar - Project Overview & Existing Resources */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                  <RiProjectorLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Project Overview
                </h2>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Teams:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {project.assignedTeams?.length > 0
                      ? project.assignedTeams.map(at => at.team.name).join(', ')
                      : 'Unassigned'
                    }
                  </span>
                </div>

                <div>
                  <span className="text-gray-500">Organisation:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {project.organisation?.name || 'Unknown'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500">Progress:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {project.progress || 0}%
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

            {/* Existing Resources */}
            {project.resources && project.resources.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                    <RiServerLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Existing Resources
                  </h2>
                </div>

                <div className="space-y-2">
                  {project.resources.map((resource: any) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center min-w-0">
                        <RiServerLine className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {resource.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {resource.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}