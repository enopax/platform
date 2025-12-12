import Container from '@/components/common/Container';
import { Card } from '@/components/common/Card';
import { Skeleton, SkeletonButton } from '@/components/common/Skeleton';

export default function OrganisationDetailsLoading() {
  return (
    <main className="mt-4">
      <Container>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <Skeleton className="h-10 w-48 mb-3" />
            <div className="flex items-center gap-4 mb-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-40" />
            <SkeletonButton />
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>

                {/* Project Description */}
                <Skeleton className="h-4 w-full mb-4" />

                {/* Resource Types */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-24 rounded" />
                  ))}
                </div>

                {/* Resource Usage Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
