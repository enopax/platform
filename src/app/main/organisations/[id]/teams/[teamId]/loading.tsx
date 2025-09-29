import { Card } from '@/components/common/Card';
import { Skeleton, SkeletonButton, SkeletonStat, SkeletonProjectCard } from '@/components/common/Skeleton';

export default function TeamDetailsLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <SkeletonButton />
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 text-center">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Projects */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <SkeletonButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonProjectCard key={i} />
              ))}
            </div>
          </Card>

          {/* Team Activity */}
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Info */}
          <Card className="p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-4">
              <SkeletonStat />
              <SkeletonStat />
              <SkeletonStat />
              <SkeletonStat />
            </div>
          </Card>

          {/* Team Members */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-24" />
              <SkeletonButton className="h-8 w-16" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </Card>

          {/* Team Storage */}
          <Card className="p-6">
            <Skeleton className="h-6 w-28 mb-4" />

            <div className="text-center mb-4">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
              <Skeleton className="h-5 w-20 mx-auto mb-1" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
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
        </div>
      </div>
    </div>
  );
}