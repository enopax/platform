import UserBarMenu from '@/components/layout/UserBarMenu';

export default function UserBar({
  user,
}: {
  user?: Object,
}) {
  return (
    <header className="hidden lg:flex border-b">
      <div className="px-4 text-sm w-full">
        <div className="mx-auto max-w-6xl w-full relative flex items-center">          
          <span className="text-xs text-gray-400 dark:text-gray-600">v{process.env.APP_VERSION}</span>
          {/* UserBarMenu positioned on the right */}
          <div className="ml-auto px-4">
            <UserBarMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
