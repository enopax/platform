import { Skeleton, SkeletonButton } from '@/components/common/Skeleton';
import { Card } from '@/components/common/Card';

export default function SettingsLoading() {
  return (
    <main>
      <div className="m-20 sm:mx-auto sm:w-full sm:max-w-md mb-4">
        <Skeleton className="h-5 w-48" />
      </div>
      <Card className="m-20 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-8" />
        </div>

        <div>
          {/* Avatar Section */}
          <div className="mb-4 flex flex-col items-center gap-2">
            <Skeleton className="h-20 w-20 rounded-full" />
            <SkeletonButton className="w-32" />
          </div>

          {/* Settings Form Fields */}
          <div className="space-y-6">
            {/* First Name */}
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Last Name */}
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Email */}
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Storage Tier */}
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Form Button */}
            <div className="pt-4">
              <SkeletonButton className="w-full h-10" />
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
