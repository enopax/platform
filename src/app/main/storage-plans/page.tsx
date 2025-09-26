import { notFound, redirect } from 'next/navigation';
import Container from '@/components/common/Container';
import { Card } from '@/components/common/Card';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/common/Badge';
import StoragePlanClient from './StoragePlanClient';

export default async function StoragePlansPage() {
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      storageTier: true,
      storageQuota: {
        select: {
          allocatedBytes: true,
          usedBytes: true,
          tier: true,
          tierUpdatedAt: true,
        }
      }
    }
  });

  if (!user) return notFound();

  const currentTier = user.storageTier || 'FREE_500MB';
  const quota = user.storageQuota;

  return (
    <main className="max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs />
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Storage Plans
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Choose the perfect storage plan for your IPFS storage needs.
          Upgrade or downgrade anytime.
        </p>
      </div>

        {/* Current Plan Status */}
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Current Plan
            </h2>
            <Badge variant="default" className="bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200">
              {currentTier.replace('_', ' ').replace('GB', ' GB').replace('MB', ' MB')}
            </Badge>
          </div>

          {quota && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(Number(quota.usedBytes) / (1024 ** 3)).toFixed(2)} GB
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Used Storage</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentTier === 'UNLIMITED' ? '∞' : (Number(quota.allocatedBytes) / (1024 ** 3)).toFixed(0)} GB
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Storage</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {currentTier === 'UNLIMITED' ? '100' : (((Number(quota.allocatedBytes) - Number(quota.usedBytes)) / Number(quota.allocatedBytes)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
              </div>
            </div>
          )}
        </Card>

        {/* Storage Plan Selection */}
        <Card className="p-8">
          <StoragePlanClient
            currentTier={currentTier as any}
            userId={user.id}
          />
        </Card>

        {/* Features Comparison */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            All Plans Include
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4">
              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-brand-600 dark:text-brand-400 text-xl">🔒</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Storage</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">End-to-end encryption and distributed storage</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-brand-600 dark:text-brand-400 text-xl">🌍</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Global Access</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Access your files from anywhere in the world</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-brand-600 dark:text-brand-400 text-xl">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Uploads</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Optimized for quick file uploads and retrieval</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-brand-600 dark:text-brand-400 text-xl">🛠️</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Developer API</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Full API access for integration</p>
            </div>
          </div>
        </div>
    </main>
  );
}