import UserBarMenu from '@/components/layout/UserBarMenu';

export default function UserBar({
  user,
}: {
  user?: Object,
}) {
  return (
    <header className="hidden lg:flex border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 text-sm w-full">
        <div className="mx-auto max-w-6xl w-full relative flex items-center">
          <span className="text-xs text-gray-400 dark:text-gray-600">v{process.env.APP_VERSION}</span>
          <div className="ml-auto px-4">
            <UserBarMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
