import { Card } from '@/components/common/Card';
import { Skeleton, SkeletonButton } from '@/components/common/Skeleton';

export default function DeveloperLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* API Keys Section */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <SkeletonButton />
        </div>

        {/* API Keys List */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-16 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Documentation Section */}
      <Card className="p-6 mb-8">
        <div className="mb-6">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </Card>

      {/* Usage Stats */}
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}