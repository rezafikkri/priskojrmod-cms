import {
  Copyright,
  Users,
  Package,
  Activity,
  DatabaseBackup,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '../ui/sidebar';
import Link from 'next/link';
import Category from '../icon/category';
import Key from '../icon/key';
import LockPassword from '../icon/lock-password';
import NavSidebarGroup from './nav-sidebar-group';
import NavSidebar from './nav-sidebar';
import UserDollar from '../icon/user-dollar';
import Script from '../icon/script';
import { NavUser } from './nav-user';

// Menu items.
const items = {
  nav: [
    { title: 'Transactions', url: '/transactions', icon: Activity },
    { title: 'Backup', url: '/backup', icon: DatabaseBackup },
  ],
  customers: {
    title: 'Customers',
    icon: <UserDollar />,
    subItems: [
      { title: 'Lists', url: '/customers' },
      { title: 'Feedback', url: '/feedback' },
    ],
  },
  document: {
    title: 'Document',
    icon: <Script />,
    subItems: [
      { title: 'Terms of Service', url: '/terms-of-service', },
      { title: 'Privacy Policy', url: '/privacy-policy' },
      { title: 'About Us', url: '/about-us' },
      { title: 'FAQs', url: '/faq' },
    ],
  },
  product: [
    { title: 'Categories', url: '/category', icon: Category },
    { title: 'Licenses', url: '/license', icon: Copyright },
    { title: 'Owners', url: '/owner', icon: Users },
    { title: 'Products', url: '/product', icon: Package },
  ],
  application: [
    { title: 'License Key', url: '/license-key', icon: Key },
    { title: 'Secret Key', url: '/secret-key', icon: LockPassword },
  ],
};

export function AppSidebar() {
  return (
    <Sidebar variant="inset" className="h-full">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="flex items-center gap-2">
                <img src="https://res.cloudinary.com/priskojrmod/image/upload/q_auto/PriskoJrMod.png" alt="Prisko Jr Mod Logo" width={32} height={32} />
                <span className="font-semibold">Prisko Jr Mod</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavSidebar items={items.nav} collapsibleItems={[items.customers, items.document]} />
        <NavSidebarGroup label="Product" items={items.product} />
        <NavSidebarGroup label="Application" items={items.application} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

