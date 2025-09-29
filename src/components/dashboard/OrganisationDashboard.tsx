'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ProgressBar } from '@/components/common/ProgressBar';
import OrganisationSelector from '@/components/common/OrganisationSelector';
import { useOrganisation } from '@/components/context/OrganisationContext';
import {
  RiProjectorLine,
  RiTeamLine,
  RiUploadLine,
  RiAddLine,
  RiBuildingLine,
  RiKeyLine,
  RiSettings3Line,
  RiServerLine
} from '@remixicon/react';
import Link from 'next/link';

type OrganisationData = {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    updatedAt: Date;
  }>;
  teams: Array<{
    id: string;
    name: string;
    teamType: string;
    memberCount: number;
  }>;
  resources: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
  }>;
  counts: {
    projects: number;
    teams: number;
    resources: number;
    members: number;
  };
};

export default function OrganisationDashboard({ user }: { user: any }) {
  const { selectedOrganisation, organisations, setOrganisations, setIsLoading } = useOrganisation();
  const [organisationData, setOrganisationData] = useState<OrganisationData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch user's organisations on mount
  useEffect(() => {
    async function fetchOrganisations() {
      try {
        const response = await fetch('/api/organisations/user-memberships');
        if (response.ok) {
          const data = await response.json();
          setOrganisations(data.organisations || []);
        }
      } catch (error) {
        console.error('Error fetching organisations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrganisations();
  }, [setOrganisations, setIsLoading]);

  // Fetch organisation-specific data when selection changes
  useEffect(() => {
    if (!selectedOrganisation) {
      setOrganisationData(null);
      return;
    }

    async function fetchOrganisationData() {
      setDataLoading(true);
      try {
        const response = await fetch(`/api/organisations/${selectedOrganisation.id}/dashboard`);
        if (response.ok) {
          const data = await response.json();
          setOrganisationData(data);
        }
      } catch (error) {
        console.error('Error fetching organisation data:', error);
      } finally {
        setDataLoading(false);
      }
    }

    fetchOrganisationData();
  }, [selectedOrganisation]);

  const recentActivity = organisationData?.projects?.slice(0, 3).map(project => ({
    type: 'project' as const,
    description: `Updated ${project.name}`,
    time: new Date(project.updatedAt).toLocaleDateString()
  })) || [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header with Organisation Selector */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name || 'there'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your organisation's projects, teams, and resources.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedOrganisation && (
              <Link href={`/main/projects/new?org=${selectedOrganisation.id}`}>
                <Button>
                  <RiAddLine className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Organisation Selector */}
        <div className="mb-6">
          <OrganisationSelector />
        </div>
      </div>

      {!selectedOrganisation ? (
        <div className="text-center py-12">
          <RiBuildingLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select an Organisation
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Choose an organisation above to view projects, teams, and resources.
          </p>
        </div>
      ) : dataLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Loading skeleton */}
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Organisation-specific content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            {/* Recent Activity */}
            <Card className="xl:col-span-2 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h2>
                <Link href="/main/projects" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700">
                  View all →
                </Link>
              </div>

              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex-shrink-0">
                        <RiProjectorLine className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <RiProjectorLine className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Organisation Stats
              </h3>
              <div className="space-y-3">
                <Link href="/main/projects" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <RiProjectorLine className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Projects</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {organisationData?.counts.projects || 0}
                  </span>
                </Link>

                <Link href="/main/teams" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <RiTeamLine className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teams</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {organisationData?.counts.teams || 0}
                  </span>
                </Link>

                <Link href="/main/resources" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <RiServerLine className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Resources</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {organisationData?.counts.resources || 0}
                  </span>
                </Link>
              </div>
            </Card>
          </div>

          {/* Projects Section */}
          {organisationData?.projects && organisationData.projects.length > 0 && (
            <Card className="p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Projects
                </h2>
                <Link href="/main/projects" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700">
                  View all {organisationData.counts.projects} projects →
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {organisationData.projects.slice(0, 3).map((project) => (
                  <Link key={project.id} href={`/main/projects/${project.id}`} className="group">
                    <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                          <RiProjectorLine className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-900 dark:group-hover:text-brand-100 transition-colors truncate">
                          {project.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant={project.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {project.status}
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {project.progress}% complete
                        </span>
                      </div>

                      <div className="mt-3">
                        <ProgressBar value={project.progress || 0} className="h-1.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href={`/main/projects/new?org=${selectedOrganisation.id}`} className="group">
                <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all text-center">
                  <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg w-fit mx-auto mb-4">
                    <RiProjectorLine className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create Project</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Start a new project with resources</p>
                </div>
              </Link>

              <Link href={`/main/teams/new?org=${selectedOrganisation.id}`} className="group">
                <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all text-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit mx-auto mb-4">
                    <RiTeamLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create Team</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Set up team collaboration</p>
                </div>
              </Link>

              <Link href={`/main/resources/new?org=${selectedOrganisation.id}`} className="group">
                <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all text-center">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg w-fit mx-auto mb-4">
                    <RiServerLine className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Add Resource</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configure new resources</p>
                </div>
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}