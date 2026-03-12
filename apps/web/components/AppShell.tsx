'use client';

import { SidebarProvider, SidebarInset } from '@synnovator/ui';
import { MainSidebar } from './MainSidebar';
import { SlimHeader } from './SlimHeader';

interface AppShellProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AppShell({
  children,
  defaultOpen = true,
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <MainSidebar />
      <SidebarInset>
        <SlimHeader />
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
