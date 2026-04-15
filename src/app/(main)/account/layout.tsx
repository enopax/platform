import AccountSidebar from '@/components/navigation/AccountSidebar';

export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-[calc(100vh-2.5rem)]">
      <div className="hidden lg:block sticky top-0 h-screen overflow-y-auto">
        <AccountSidebar />
      </div>
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
