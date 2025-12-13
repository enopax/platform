import { Skeleton, SkeletonButton } from '@/components/common/Skeleton';

export default function DeveloperLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-16">
      {/* Breadcrumbs */}
      <div>
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Page Header */}
      <section className="space-y-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </section>

      {/* Overview Stats */}
      <section className="space-y-6">
        <Skeleton className="h-6 w-24" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Create API Key Section */}
      <section className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <SkeletonButton className="w-full" />
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* API Keys Table */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`p-4 flex items-center justify-between ${i !== 4 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Documentation Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <SkeletonButton />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />

          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="bg-gray-950 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>

            <div>
              <Skeleton className="h-4 w-20 mb-3" />
              <div className="bg-gray-950 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
