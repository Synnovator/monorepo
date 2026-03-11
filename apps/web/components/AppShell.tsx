'use client';

import { SidebarProvider, SidebarInset } from '@synnovator/ui';
import { MainSidebar } from './MainSidebar';
import { SlimHeader } from './SlimHeader';

interface AppShellProps {
  children: React.ReactNode;
  showAdmin?: boolean;
  defaultOpen?: boolean;
}

export function AppShell({
  children,
  showAdmin = false,
  defaultOpen = true,
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <MainSidebar showAdmin={showAdmin} />
      <SidebarInset>
        <SlimHeader />
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
