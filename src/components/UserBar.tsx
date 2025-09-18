import Container from '@/components/common/Container';
import Logo from '@/components/Logo';
import UserBarNav from '@/components/UserBarNav';
import UserBarMenu from '@/components/UserBarMenu';

export default function UserBar({
  user,
}: {
  user?: Object,
}) {
  return (
    <header className="sticky top-0 z-50">
      <div className="p-4 bg-gray-50/90 text-sm w-full dark:bg-gray-950/90">
        <div className="mx-auto max-w-6xl w-full relative flex items-center">
          {/* Logo centered relative to page width */}
          <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
            <Logo />
          </div>
          
          {/* UserBarMenu positioned on the right */}
          <div className="ml-auto px-4">
            <UserBarMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
