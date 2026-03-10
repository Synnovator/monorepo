'use client';

import { useInView } from '@/hooks/useInView';

interface SketchProps {
  className?: string;
  delay?: number;
}

export function SketchCircle({ className = '', delay = 0 }: SketchProps) {
  const { ref, isInView } = useInView<SVGSVGElement>();
  const pathLength = 180;

  return (
    <svg
      ref={ref}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className={`sketch-mark ${className}`}
      data-visible={isInView}
      style={{ '--path-length': pathLength, animationDelay: `${delay}ms` } as React.CSSProperties}
      aria-hidden="true"
    >
      <ellipse
        cx="20" cy="20" rx="16" ry="14"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength}
        transform="rotate(-5 20 20)"
      />
    </svg>
  );
}
