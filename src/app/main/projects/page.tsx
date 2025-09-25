import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import EnhancedProjectGrid from '@/components/EnhancedProjectGrid';
import TeamFilter from '@/components/TeamFilter';
import {
  RiAddLine,
  RiUserLine,
  RiSearchLine,
  RiFilterLine,
  RiGridLine,
  RiMenuLine,
  RiSortAscLine,
  RiMoreLine
} from '@remixicon/react';
import Link from 'next/link';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; search?: string; sort?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { team: selectedTeamId, search, sort, status } = await searchParams;

  // Simplified queries - only check team membership, not organisation membership
  const [allProjects, teams] = await Promise.all([
    prisma.project.findMany({
      where: {
        team: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } }
          ]
        }
      },
      include: {
        team: {
          include: {
            owner: true,
            organisation: true,
            _count: {
              select: {
                members: true,
                projects: true
              }
            }
          }
        },
        resources: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    }),
    prisma.team.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        owner: true,
        organisation: true,
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      },
      orderBy: [
        { isPersonal: 'desc' },
        { name: 'asc' }
      ]
    })
  ]);

  // Filter and sort projects
  let filteredProjects = selectedTeamId
    ? allProjects.filter(project => project.teamId === selectedTeamId)
    : allProjects;

  // Apply search filter
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredProjects = filteredProjects.filter(project =>
      project.name.toLowerCase().includes(searchTerm) ||
      project.description?.toLowerCase().includes(searchTerm) ||
      project.team.name.toLowerCase().includes(searchTerm)
    );
  }

  // Apply status filter
  if (status && status !== 'all') {
    filteredProjects = filteredProjects.filter(project => project.status === status);
  }

  // Apply sorting
  switch (sort) {
    case 'oldest':
      filteredProjects.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case 'name':
      filteredProjects.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filteredProjects.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'progress':
      filteredProjects.sort((a, b) => (b.progress || 0) - (a.progress || 0));
      break;
    default: // 'newest' or undefined
      filteredProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  const projects = filteredProjects;

  const selectedTeam = selectedTeamId ? teams.find(t => t.id === selectedTeamId) : null;

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs />
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your projects and filter by team
            </p>
          </div>
        </div>
      </div>

      {/* Team Filter & Create Button */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TeamFilter
            teams={teams}
            selectedTeamId={selectedTeamId}
            totalProjects={allProjects.length}
          />
          <Link href="/main/projects/new">
            <Button className="w-full sm:w-auto">
              <RiAddLine className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Enhanced Project Grid with Smart Filtering */}
      <EnhancedProjectGrid
        projects={projects}
        selectedTeamName={selectedTeam?.name}
      />

      {/* Quick Actions Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link href="/main/projects/new" className="group">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer">
              <RiAddLine className="h-6 w-6 text-gray-400 group-hover:text-brand-500 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Create New Project</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start a new project and assign it to a team
              </p>
            </div>
          </Link>

          <div className="opacity-50 cursor-not-allowed">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <RiUserLine className="h-6 w-6 text-gray-400 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Join Project</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Request to join existing projects (coming soon)
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}