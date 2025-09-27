'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/common/Button';
import {
  TabNavigation,
  TabNavigationLink
} from '@/components/menu/TabNavigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/menu/DropdownMenu';

type Route = {
  url: string,
  label: string,
  disabled?: boolean
};

export default function UserBarNav() {
  const pathname = usePathname();
  const active = 'border-brand-500 text-brand-500';
  const hover = 'hover:text-brand-500';
  const routes = [
    /*{
      url: '/activities',
      label: 'Activities',
    }, {
      url: '/services',
      label: 'Services',
    }, {
      url: '/gallery',
      label: 'Gallery',
    }*/
  ];

  function isActiveRoute(pathname: string, routeUrl: string): boolean {
    if (routeUrl === '/') return pathname === '/';
    return pathname.startsWith(routeUrl);
  }

  return (
    <header>
      {/*---- Desktop Nav ----*/}
      <div className="text-2xl text-white">
        <TabNavigation>
          {routes.map((route: Route, i: number) => (
            <TabNavigationLink
              key={i}
              href={route.url}
              disabled={route.disabled}
              className={isActiveRoute(pathname, route.url) ? active : hover}
            >
              {route.label}
            </TabNavigationLink>
          ))}
        </TabNavigation>
      </div>

      <div className="block sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              Menu
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuGroup> 
            {routes.map((route: Route, i: number) => (
              <Link key={i} href={route.url}>
                 <DropdownMenuItem disabled={route.disabled}>
                    {route.label}
                 </DropdownMenuItem>
                 {i < routes.length-1 && <DropdownMenuSeparator />}
              </Link>
            ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
