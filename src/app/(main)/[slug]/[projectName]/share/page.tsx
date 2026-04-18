import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Callout } from '@/components/common/Callout';
import { RiShareLine, RiInformationLine, RiBuildingLine, RiUserLine } from '@remixicon/react';
import ShareProjectForm from '@/components/form/ShareProjectForm';
import ChangeSharePermissionForm from '@/components/project/ChangeSharePermissionForm';
import RevokeShareButton from '@/components/project/RevokeShareButton';

interface ProjectSharePageProps {
  params: Promise<{ slug: string; projectName: string }>;
}

export default async function ProjectSharePage({ params }: ProjectSharePageProps) {
  const { slug, projectName } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(slug);
  if (!organisation) notFound();

  const project = await store.projects.findByNameAndOrg(projectName, organisation.id);
  if (!project) notFound();

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisation.id);
  const isOrgAdmin =
    session.user.role === 'SUPERADMIN' ||
    (membership && ['OWNER', 'ADMIN'].includes(membership.role));

  if (!isOrgAdmin) {
    notFound();
  }

  const shares = await store.projectShares.findByProjectId(project.id);

  const sharesWithNames = await Promise.all(
    shares.map(async (share) => {
      let entityName = share.sharedWithId;
      if (share.sharedWithType === 'ORGANISATION') {
        const org = await store.organisations.findById(share.sharedWithId);
        entityName = org?.name ?? share.sharedWithId;
      } else {
        const user = await store.users.findById(share.sharedWithId);
        entityName = user?.name ?? user?.email ?? share.sharedWithId;
      }
      return { ...share, entityName };
    })
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Share Project</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Share {projectName} with external organisations or users
          </p>
        </div>
      </div>

      <Callout variant="default" title="Cross-organisation sharing" icon={RiInformationLine} className="mb-6">
        Shared organisations or users can access this project based on the permission level you assign.
        This does not grant membership to your organisation.
      </Callout>

      <div className="space-y-6">
        <ShareProjectForm
          projectId={project.id}
          organisationName={slug}
          projectName={projectName}
        />

        {sharesWithNames.length > 0 && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Current shares
              </h2>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {sharesWithNames.map((share) => (
                <li
                  key={share.id}
                  className="flex items-center justify-between px-6 py-4 flex-wrap gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                      {share.sharedWithType === 'ORGANISATION' ? (
                        <RiBuildingLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      ) : (
                        <RiUserLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {share.entityName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default" className="text-xs">
                          {share.sharedWithType}
                        </Badge>
                        <Badge
                          variant={
                            share.status === 'ACTIVE' ? 'success' :
                            share.status === 'INVITED' ? 'warning' :
                            share.status === 'DECLINED' ? 'error' :
                            'default'
                          }
                          className="text-xs"
                        >
                          {share.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {share.status === 'ACTIVE' && (
                      <ChangeSharePermissionForm
                        shareId={share.id}
                        currentPermission={share.permission}
                      />
                    )}
                    {(share.status === 'ACTIVE' || share.status === 'INVITED') && (
                      <RevokeShareButton
                        shareId={share.id}
                        entityName={share.entityName}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {sharesWithNames.length === 0 && (
          <Card className="p-12 text-center">
            <RiShareLine className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              This project has not been shared with anyone yet
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
