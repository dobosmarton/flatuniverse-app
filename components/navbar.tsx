'use client';

import Link from 'next/link';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from './ui/navigation-menu';
import { Button } from './ui/button';
import { UserNav } from './user-nav';

export const Navbar: React.FunctionComponent = () => {
  return (
    <>
      <NavigationMenu>
        <NavigationMenuList className="flex gap-6">
          <NavigationMenuItem>
            <Link href="/">
              <span className="font-bold">Flat universe</span>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/about">About</Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="ml-auto flex items-center space-x-4">
        <UserNav />
      </div>
    </>
  );
};
