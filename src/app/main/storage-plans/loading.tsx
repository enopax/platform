import { Card } from '@/components/common/Card';
import { Skeleton, SkeletonButton } from '@/components/common/Skeleton';

export default function StoragePlansLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-5 w-96 mx-auto mb-2" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>

      {/* Current Plan */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 border border-brand-200 dark:border-brand-700">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </Card>

      {/* Storage Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className={`p-8 relative ${i === 1 ? 'border-2 border-brand-500 dark:border-brand-400' : ''}`}>
            {i === 1 && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            )}

            <div className="text-center mb-6">
              <Skeleton className="h-7 w-24 mx-auto mb-3" />
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-5 w-8" />
              </div>
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>

            {/* Features list */}
            <div className="space-y-3 mb-8">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <SkeletonButton className="w-full h-11" />
          </Card>
        ))}
      </div>

      {/* Usage Statistics */}
      <Card className="p-8">
        <Skeleton className="h-6 w-40 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <Skeleton className="h-12 w-20 mx-auto mb-3" />
            <Skeleton className="h-5 w-24 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>

          <div className="text-center">
            <Skeleton className="h-12 w-16 mx-auto mb-3" />
            <Skeleton className="h-5 w-20 mx-auto mb-2" />
            <Skeleton className="h-4 w-28 mx-auto" />
          </div>

          <div className="text-center">
            <div className="relative mx-auto mb-3">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            </div>
            <Skeleton className="h-5 w-28 mx-auto mb-2" />
            <Skeleton className="h-4 w-36 mx-auto" />
          </div>
        </div>
      </Card>
    </div>
  );
}