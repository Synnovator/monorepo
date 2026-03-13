import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';

export default async function EditLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '/edit';
    redirect(`/login?returnTo=${encodeURIComponent(pathname)}`);
  }

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET!) as Session | null;
  if (!session) redirect('/login');

  return <>{children}</>;
}
