import { Suspense } from 'react';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-lime-primary focus:text-near-black focus:px-4 focus:py-2 focus:rounded-md">
        Skip to main content
      </a>
      <Suspense>
        <NavBar />
      </Suspense>
      <main id="main-content" className="pt-16">{children}</main>
      <Suspense>
        <Footer />
      </Suspense>
    </>
  );
}
