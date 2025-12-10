import Container from '@/components/common/Container';
import Logo from '@/components/layout/Logo';
import UserBarNav from '@/components/layout/UserBarNav';
import UserBarMenu from '@/components/layout/UserBarMenu';

export default function UserBar({
  user,
}: {
  user?: Object,
}) {
  return (
    <header className="border-b">
      <div className="px-4 text-sm w-full">
        <div className="mx-auto max-w-6xl w-full relative flex items-center">          
          {/* UserBarMenu positioned on the right */}
          <div className="ml-auto px-4">
            <UserBarMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
