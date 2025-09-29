import { Card } from '@/components/common/Card';
import { Skeleton, SkeletonButton } from '@/components/common/Skeleton';

export default function AddResourceLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Skeleton className="h-6 w-72" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-4 w-96" />
          </div>
          <SkeletonButton />
        </div>
      </div>

      {/* Wizard Content */}
      <Card className="p-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full rounded-full mb-4" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-96 mb-6" />
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 relative">
                <div className="flex items-center mb-4">
                  <Skeleton className="h-12 w-12 rounded-lg mr-3" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>

                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-4" />

                <div className="space-y-2">
                  <Skeleton className="h-4 w-16 mb-2" />
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center">
                      <Skeleton className="h-3 w-3 rounded-full mr-2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start">
              <Skeleton className="h-5 w-5 rounded mr-3 mt-0.5" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </Card>
    </div>
  );
}