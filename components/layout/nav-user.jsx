'use client';

import {
  ChevronsUpDown,
  LogOut,
  User,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import ToggleTheme from './toggle-theme';
import { signOut, useSession } from 'next-auth/react';
import NavUserSkeleton from '../loadings/nav-user-skeleton';

export function NavUser() {
  const { isMobile } = useSidebar()
  const { data: session, status } = useSession();
  const name = `${session?.user?.first_name} ${session?.user?.last_name}`;
  const email = session?.user?.email;
  const image = session?.user?.image;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {status === 'loading' ? (
          <NavUserSkeleton />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <img
                  src={image}
                  alt={name}
                  loading="lazy"
                  decoding="async"
                  className="size-8 rounded-full"
                />
                <div className="min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold block">{name}</span>
                  <span className="truncate text-xs block">{email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <img
                    src={image}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    className="size-8 rounded-full object-cover"
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{name}</span>
                    <span className="truncate text-xs">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/account-settings" className="cursor-pointer"><User /> Account Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <ToggleTheme />
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="w-full focus:bg-red-100/70 dark:focus:bg-red-300/10"
                asChild
              >
                <button onClick={() => signOut({ callbackUrl: '/signin' })}>
                  <LogOut /> Sign Out
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
