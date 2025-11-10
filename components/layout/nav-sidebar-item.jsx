import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '../ui/sidebar';
import Link from 'next/link';

export default function NavSidebarItem({ items }) {
  return items.map(item => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <Link href={item.url}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));
}
