import { Card } from '@/components/common/Card';
import { Skeleton, SkeletonButton } from '@/components/common/Skeleton';

export default function ResourceDetailsLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Skeleton className="h-6 w-72" />
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div>
              <Skeleton className="h-8 w-56 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <SkeletonButton />
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* File Browser */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2">
                <SkeletonButton />
                <SkeletonButton />
              </div>
            </div>

            {/* File Browser Toolbar */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-24" />
            </div>

            {/* File List */}
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-6">
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-10" />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Resource Info Sidebar */}
        <div className="space-y-6">
          {/* Resource Details */}
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-18" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </Card>

          {/* Storage Usage */}
          <Card className="p-6">
            <Skeleton className="h-6 w-28 mb-4" />

            <div className="text-center mb-4">
              <Skeleton className="h-16 w-16 rounded-full mx-auto mb-2" />
              <Skeleton className="h-5 w-20 mx-auto mb-1" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between text-sm">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="space-y-3">
              <SkeletonButton className="w-full" />
              <SkeletonButton className="w-full" />
              <SkeletonButton className="w-full" />
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}