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
    { title: 'Transactions', url: '/transaction' },
  ],
  customer: {
    title: 'Customers',
    subItems: [
      { title: 'List', url: '/customer' },
      { title: 'Feedback', url: '/feedback' },
      { title: 'Testimonials', url: '/testimonial' },
    ],
  },
  document: {
    title: 'Document',
    subItems: [
      { title: 'Terms of Service', url: '/terms-of-service', },
      { title: 'Privacy Policy', url: '/privacy-policy' },
      { title: 'About Us', url: '/about-us' },
      { title: 'FAQs', url: '/faq' },
    ],
  },
  product: [
    { title: 'Categories', url: '/category' },
    { title: 'Licenses', url: '/license' },
    { title: 'Owners', url: '/owner' },
    { title: 'Products', url: '/product' },
  ],
  application: [
    { title: 'License Keys', url: '/license-key' },
    { title: 'Secret Keys', url: '/secret-key' },
  ],
  system: [
    { title: 'Admins', url: '/admin', role: AdminRole.OWNER },
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
                <img src="https://ik.imagekit.io/amruk/PJM/PriskoJrMod.png" alt="Prisko Jr Mod Logo" width={32} height={32} />
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

