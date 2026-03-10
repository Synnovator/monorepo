import Link from 'next/link';
import { SketchDoodle } from '@/components/sketch';

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <SketchDoodle variant="question" className="mx-auto mb-4" />
      <h1 className="text-6xl font-heading font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-foreground mb-2">Page Not Found</p>
      <p className="text-muted-foreground mb-8">Sorry, the page you are looking for does not exist</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
