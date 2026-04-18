'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/common/Container';
import { Tabs, TabsList, TabsTrigger } from '@/components/common/Tabs';

export default function AdminNavigation() {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname.includes('/admin/user')) return 'users';
    if (pathname.includes('/admin/organisations')) return 'organisations';
    if (pathname.includes('/admin/projects')) return 'projects';
    if (pathname.includes('/admin/requests')) return 'requests';
    return 'users';
  };

  const navItems = [
    { id: 'users', label: 'Users', href: '/admin/users' },
    { id: 'organisations', label: 'Organisations', href: '/admin/organisations' },
    { id: 'projects', label: 'Projects', href: '/admin/projects' },
    { id: 'requests', label: 'Requests', href: '/admin/requests' },
  ];

  return (
    <Container>
      <Tabs value={getActiveTab()}>
        <TabsList className="mb-6">
          {navItems.map((item) => (
            <Link key={item.id} href={item.href}>
              <TabsTrigger value={item.id}>
                {item.label}
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>
      </Tabs>
    </Container>
  );
}