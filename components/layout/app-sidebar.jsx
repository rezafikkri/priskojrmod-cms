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
import NavSidebarGroup from './nav-sidebar-group';
import { NavUser } from './nav-user';
import NavSidebarItem from './nav-sidebar-item';
import NavSidebarItemCollapsible from './nav-sidebar-item-collapsible';
import { AdminRole } from '@/constants/enums';

// Menu items
const menu = {
  sales: [
    { text: 'Transactions', url: '/transaction' },
  ],
  customer: {
    text: 'Customers',
    subItems: [
      { text: 'List', url: '/customer' },
      { text: 'Feedback', url: '/feedback' },
      { text: 'Testimonials', url: '/testimonial' },
    ],
  },
  document: {
    text: 'Documents',
    subItems: [
      { text: 'Terms of service', url: '/terms-of-service' },
      { text: 'Privacy policy', url: '/privacy-policy' },
      { text: 'About us', url: '/about-us' },
      { text: 'FAQs', url: '/faq' },
    ],
  },
  product: [
    { text: 'Categories', url: '/category' },
    { text: 'Licenses', url: '/license' },
    { text: 'Owners', url: '/owner' },
    { text: 'Products', url: '/product' },
  ],
  application: [
    { text: 'Secret keys', url: '/secret-key' },
    { text: 'License keys', url: '/license-key' },
  ],
  system: [
    { text: 'Admins', url: '/admin', role: AdminRole.OWNER },
  ],
};

export async function AppSidebar() {
  return (
    <Sidebar variant="inset" className="h-full">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="flex items-center gap-2">
                <img src="https://res.cloudinary.com/priskojrmod/image/upload/v1740827617/PriskoJrMod.png" alt="Prisko Jr Mod Logo" width={32} height={32} />
                <span className="font-semibold">Prisko Jr Mod</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2">
          <NavSidebarItem items={menu.sales} />
          <NavSidebarItemCollapsible item={menu.customer} />
          <NavSidebarItemCollapsible item={menu.document} />
        </SidebarMenu>
        <NavSidebarGroup label="Product" items={menu.product} />
        <NavSidebarGroup label="Application" items={menu.application} />
        <SidebarMenu className="p-2">
          <NavSidebarItem items={menu.system} />
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

