'use client';

import { useSession } from 'next-auth/react';
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '../ui/sidebar';
import Link from 'next/link';
import sidebarIcons from './sidebar-icons';
import { Skeleton } from '../ui/skeleton';

export default function NavSidebarItem({ items }) {
  const { data: session, status } = useSession();
  let filteredItems = items;

  if (status !== 'loading') {
    filteredItems = items.filter(item => !item.role || session?.user?.role === item.role);
  }

  return filteredItems.map(item => {
    const Icon = sidebarIcons[item.title];
    return (
      <SidebarMenuItem key={item.title}>
        {(status === 'loading' && item.role) ? (
          <Skeleton className="w-full h-8 bg-[#EBEBED] dark:bg-accent" />
        ) : (
          <SidebarMenuButton asChild>
            <Link href={item.url}>
              <Icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    );
  });
}
