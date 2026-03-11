import { Suspense } from 'react';
import { AppShell } from '@/components/AppShell';
import { Footer } from '@/components/Footer';
import { WelcomeDialog } from '@/components/WelcomeDialog';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md">
        Skip to main content
      </a>
      <Suspense>
        <AppShell>
          <main id="main-content">{children}</main>
          <Suspense>
            <Footer />
          </Suspense>
        </AppShell>
      </Suspense>
      <Suspense>
        <WelcomeDialog />
      </Suspense>
    </>
  );
}
