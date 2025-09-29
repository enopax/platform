import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Container from '@/components/common/Container';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import Link from 'next/link';
import {
  RiServerLine,
  RiAddLine,
  RiArrowRightLine,
  RiHomeLine,
  RiDatabaseLine,
  RiCloudLine,
  RiHardDriveLine,
  RiGlobalLine
} from '@remixicon/react';

interface OrganisationResourcesPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganisationResourcesPage({ params }: OrganisationResourcesPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  // Check if user is admin
  const isAdmin = session.user.role === 'ADMIN';

  // Check if user is a member of this organisation
  const membership = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId: id
      }
    }
  });

  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';
  const isMember = !!membership;

  // Anyone can view the page, but need to be a member or admin to see details
  if (!isMember && !isAdmin) {
    notFound();
  }

  // Only owners, managers, and admins can access management actions
  const canManage = isOwner || isManager || isAdmin;

  // Fetch the organisation
  const organisation = await prisma.organisation.findUnique({
    where: {
      id,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      description: true
    }
  });

  if (!organisation) {
    notFound();
  }

  // Mock resources for now - in a real app these would come from database
  const resourceCategories = [
    {
      id: 'storage',
      name: 'File Storage',
      description: 'IPFS-based distributed file storage for your organisation',
      icon: RiHardDriveLine,
      items: [
        {
          id: 'files-1',
          name: 'File Browser',
          description: 'Browse and manage organisation files',
          status: 'active',
          usage: '2.4 GB / 10 GB'
        }
      ]
    },
    {
      id: 'compute',
      name: 'Compute Resources',
      description: 'Processing power and computational resources',
      icon: RiServerLine,
      items: [
        {
          id: 'compute-1',
          name: 'Processing Nodes',
          description: 'Distributed computing infrastructure',
          status: 'coming-soon',
          usage: 'Not available'
        }
      ]
    },
    {
      id: 'network',
      name: 'Network & CDN',
      description: 'Content delivery and network resources',
      icon: RiGlobalLine,
      items: [
        {
          id: 'network-1',
          name: 'Content Delivery',
          description: 'Global content distribution network',
          status: 'coming-soon',
          usage: 'Not available'
        }
      ]
    },
    {
      id: 'databases',
      name: 'Databases',
      description: 'Shared databases and data storage',
      icon: RiDatabaseLine,
      items: [
        {
          id: 'db-1',
          name: 'Shared PostgreSQL',
          description: 'Organisation database resources',
          status: 'coming-soon',
          usage: 'Not available'
        }
      ]
    }
  ];

  return (
    <main className="mt-4">
      <Container>
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/main" className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center">
            <RiHomeLine className="h-4 w-4 mr-1" />
            Main
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <Link href="/main/organisations" className="hover:text-gray-900 dark:hover:text-gray-100">
            Organisations
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <Link href={`/main/organisations/${id}`} className="hover:text-gray-900 dark:hover:text-gray-100">
            {organisation.name}
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <span className="text-gray-900 dark:text-gray-100 font-medium">Resources</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Resources
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage shared resources for {organisation.name}
            </p>
          </div>
        </div>

        {/* Resource Categories */}
        <div className="space-y-8">
          {resourceCategories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center gap-3 mb-4">
                <category.icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((item) => (
                  <div key={item.id}>
                    {item.status === 'active' ? (
                      <Link
                        href={`/main/organisations/${id}/resources/${item.id}`}
                        className="block"
                      >
                        <Card className="p-6 hover:shadow-md transition-shadow h-full">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {item.name}
                            </h3>
                            <Badge variant="success" className="text-xs">
                              Active
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {item.description}
                          </p>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Usage:</span>
                              <span className="text-gray-900 dark:text-white font-medium">
                                {item.usage}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end">
                            <RiArrowRightLine className="h-4 w-4 text-gray-400" />
                          </div>
                        </Card>
                      </Link>
                    ) : (
                      <Card className="p-6 h-full opacity-75">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Coming Soon
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {item.description}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Status:</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {item.usage}
                            </span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Section */}
        <Card className="p-8 text-center mt-8">
          <RiCloudLine className="mx-auto h-16 w-16 text-gray-400 mb-6" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            More Resources Coming Soon
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            We're continuously adding new resource types including compute clusters,
            shared databases, API gateways, and more.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Currently available: File storage via IPFS distributed network
          </p>
        </Card>
      </Container>
    </main>
  );
}