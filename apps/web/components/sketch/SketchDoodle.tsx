'use client';

import { useInView } from '@/hooks/useInView';

interface SketchDoodleProps {
  variant: 'question' | 'lightbulb' | 'rocket';
  className?: string;
  delay?: number;
}

export function SketchDoodle({ variant, className = '', delay = 0 }: SketchDoodleProps) {
  const { ref, isInView } = useInView<SVGSVGElement>();
  const pathLength = 120;

  const paths: Record<string, string> = {
    question: 'M20 8 C20 4, 28 4, 28 8 C28 12, 24 14, 24 20 M24 26 L24 27',
    lightbulb: 'M24 6 C18 6, 14 12, 18 18 C20 22, 20 24, 20 26 L28 26 C28 24, 28 22, 30 18 C34 12, 30 6, 24 6 M20 30 L28 30 M22 34 L26 34',
    rocket: 'M24 38 L24 24 C24 16, 20 8, 24 4 C28 8, 24 16, 24 24 M18 30 L24 24 L30 30 M20 36 L24 32 L28 36',
  };

  return (
    <svg
      ref={ref}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      className={`sketch-mark ${className}`}
      data-visible={isInView}
      style={{ '--path-length': pathLength, animationDelay: `${delay}ms` } as React.CSSProperties}
      aria-hidden="true"
    >
      <path
        d={paths[variant]}
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength}
      />
    </svg>
  );
}
