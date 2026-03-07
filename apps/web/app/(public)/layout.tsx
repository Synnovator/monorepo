import { Suspense } from 'react';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <NavBar />
      </Suspense>
      <main className="pt-16">{children}</main>
      <Suspense>
        <Footer />
      </Suspense>
    </>
  );
}
