'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { t } from '@synnovator/shared/i18n';
import { useLangHref } from '@/hooks/useLangHref';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@synnovator/ui';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@synnovator/ui';
import {
  TrophyIcon,
  ClipboardListIcon,
  UsersIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
} from './icons';
import type { FC, ComponentProps } from 'react';

interface NavItem {
  href: string;
  labelKey: string;
  icon?: FC<ComponentProps<'svg'> & { size?: number }>;
}

interface CollapsibleNavGroup {
  labelKey: string;
  icon: FC<ComponentProps<'svg'> & { size?: number }>;
  items: NavItem[];
}

const topItems: NavItem[] = [
  { href: '/', labelKey: 'sidebar.events', icon: TrophyIcon },
  { href: '/proposals', labelKey: 'sidebar.proposals', icon: ClipboardListIcon },
  { href: '/teams', labelKey: 'sidebar.teams', icon: UsersIcon },
];

const guidesGroup: CollapsibleNavGroup = {
  labelKey: 'sidebar.guides',
  icon: SparklesIcon,
  items: [
    { href: '/guides/hacker', labelKey: 'sidebar.guide_hacker' },
    { href: '/guides/organizer', labelKey: 'sidebar.guide_organizer' },
    { href: '/guides/judge', labelKey: 'sidebar.guide_judge' },
  ],
};

const adminGroup: CollapsibleNavGroup = {
  labelKey: 'sidebar.admin',
  icon: ShieldCheckIcon,
  items: [
    { href: '/admin', labelKey: 'sidebar.admin_dashboard' },
    { href: '/admin/hackathons', labelKey: 'sidebar.admin_hackathons' },
    { href: '/admin/profiles', labelKey: 'sidebar.admin_profiles' },
    { href: '/admin/submissions', labelKey: 'sidebar.admin_submissions' },
    { href: '/admin/theme', labelKey: 'sidebar.admin_theme' },
  ],
};

export function MainSidebar() {
  const pathname = usePathname();
  const { lang, langHref } = useLangHref();

  function isGroupActive(items: NavItem[]) {
    return items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href={langHref('/')}>
          <Image src="/logo-dark.svg" alt="Synnovator" width={72} height={36} className="dark:hidden" />
          <Image src="/logo-light.svg" alt="Synnovator" width={72} height={36} className="hidden dark:block" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Top-level items */}
              {topItems.map(item => {
                const Icon = item.icon!;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={t(lang, item.labelKey)}
                    >
                      <Link href={langHref(item.href)}>
                        <Icon size={20} />
                        <span>{t(lang, item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Guides collapsible group */}
              <CollapsibleGroup
                group={guidesGroup}
                lang={lang}
                pathname={pathname}
                langHref={langHref}
                defaultOpen={isGroupActive(guidesGroup.items)}
              />

              {/* Admin collapsible group */}
              <CollapsibleGroup
                group={adminGroup}
                lang={lang}
                pathname={pathname}
                langHref={langHref}
                defaultOpen={isGroupActive(adminGroup.items)}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

function CollapsibleGroup({
  group,
  lang,
  pathname,
  langHref,
  defaultOpen,
}: {
  group: CollapsibleNavGroup;
  lang: 'zh' | 'en';
  pathname: string;
  langHref: (path: string) => string;
  defaultOpen: boolean;
}) {
  const Icon = group.icon;

  return (
    <Collapsible asChild defaultOpen={defaultOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={t(lang, group.labelKey)}>
            <Icon size={20} />
            <span>{t(lang, group.labelKey)}</span>
            <ChevronDownIcon
              size={16}
              className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.items.map(item => (
              <SidebarMenuSubItem key={item.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === item.href}
                >
                  <Link href={langHref(item.href)}>
                    <span>{t(lang, item.labelKey)}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
