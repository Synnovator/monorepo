'use client';

import { useInView } from '@/hooks/useInView';

interface SketchProps {
  className?: string;
  delay?: number;
}

export function SketchArrow({ className = '', delay = 0 }: SketchProps) {
  const { ref, isInView } = useInView<SVGSVGElement>();
  const pathLength = 80;

  return (
    <svg
      ref={ref}
      width="60"
      height="30"
      viewBox="0 0 60 30"
      className={`sketch-mark ${className}`}
      data-visible={isInView}
      style={{ '--path-length': pathLength, animationDelay: `${delay}ms` } as React.CSSProperties}
      aria-hidden="true"
    >
      <path
        d="M4 22 C16 22, 28 8, 52 12"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength}
      />
      <path
        d="M46 6 L52 12 L44 16"
        strokeDasharray={30}
        strokeDashoffset={30}
      />
    </svg>
  );
}
