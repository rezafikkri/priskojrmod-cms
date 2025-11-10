import {
  Copyright,
  Users,
  Package,
  Activity,
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
import UserDollar from '../icon/user-dollar';
import Script from '../icon/script';
import { NavUser } from './nav-user';
import { UserCog } from 'lucide-react';
import NavSidebarItem from './nav-sidebar-item';
import NavSidebarItemCollapsible from './nav-sidebar-item-collapsible';

// Menu items.
const items = {
  sales: [
    { title: 'Transactions', url: '/transaction', icon: Activity },
  ],
  customer: {
    title: 'Customers',
    icon: UserDollar,
    subItems: [
      { title: 'List', url: '/customer' },
      { title: 'Feedback', url: '/feedback' },
      { title: 'Testimonials', url: '/testimonial' },
    ],
  },
  document: {
    title: 'Document',
    icon: Script,
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
    { title: 'License Keys', url: '/license-key', icon: Key },
    { title: 'Secret Keys', url: '/secret-key', icon: LockPassword },
  ],
  system: [
    { title: 'Admins', url: '/admin', icon: UserCog },
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
        <SidebarMenu className="p-2">
          <NavSidebarItem items={items.sales} />
          <NavSidebarItemCollapsible item={items.customer} />
          <NavSidebarItemCollapsible item={items.document} />
        </SidebarMenu>
        <NavSidebarGroup label="Product" items={items.product} />
        <NavSidebarGroup label="Application" items={items.application} />
        <SidebarMenu className="p-2">
          <NavSidebarItem items={items.system} />
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

