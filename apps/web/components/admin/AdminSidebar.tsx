'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Session } from '@synnovator/shared/auth';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@synnovator/ui';

const navItems = [
  { href: '/admin', key: 'admin.dashboard' },
  { href: '/admin/hackathons', key: 'admin.hackathons' },
  { href: '/admin/profiles', key: 'admin.profiles' },
  { href: '/admin/submissions', key: 'admin.submissions' },
  { href: '/admin/theme', key: 'admin.theme' },
] as const;

export function AdminSidebar({ user }: { user: Session }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);

  return (
    <Sidebar
      collapsible="icon"
      style={{ top: '4rem', height: 'calc(100svh - 4rem)' }}
    >
      <SidebarHeader className="p-4">
        <h2 className="text-primary font-heading text-lg group-data-[collapsible=icon]:hidden">
          {t(lang, 'admin.title')}
        </h2>
        <p className="text-muted-foreground text-sm group-data-[collapsible=icon]:hidden">
          @{user.login}
        </p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>{t(lang, item.key)}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
