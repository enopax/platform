import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Badge } from '@/components/common/Badge';
import { getStoreAsync } from '@/lib/store';
import Link from 'next/link';

export default async function ProjectAdminPage() {
  const store = await getStoreAsync();
  const allOrgs = await store.organisations.search('', 10000);

  const projectsByOrg = await Promise.all(
    allOrgs.map(async (org) => {
      const projects = await store.projects.findByOrgId(org.id);
      return { org, projects };
    })
  );

  const totalProjects = projectsByOrg.reduce((sum, { projects }) => sum + projects.length, 0);

  return (
    <main className="mt-4">
      <Container>
        <Headline>All Projects ({totalProjects})</Headline>

        <div className="space-y-6 mt-6">
          {projectsByOrg.filter(({ projects }) => projects.length > 0).map(({ org, projects }) => (
            <div key={org.id}>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {org.name} ({projects.length})
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                {projects.map((project) => (
                  <Link key={project.id} href={`/${org.name}/${project.name}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{project.name}</span>
                        {project.description && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{project.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={project.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {project.status}
                        </Badge>
                        <span className="text-xs text-gray-400">{project.createdAt.toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {totalProjects === 0 && (
            <p className="text-gray-500 text-center py-12">No projects yet</p>
          )}
        </div>
      </Container>
    </main>
  );
}
