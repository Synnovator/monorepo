'use client';

import { useInView } from '@/hooks/useInView';

interface SketchProps {
  className?: string;
  delay?: number;
  width?: number;
}

export function SketchUnderline({ className = '', delay = 0, width = 100 }: SketchProps) {
  const { ref, isInView } = useInView<SVGSVGElement>();
  const pathLength = width + 20;

  return (
    <svg
      ref={ref}
      width={width}
      height="8"
      viewBox={`0 0 ${width} 8`}
      className={`sketch-mark ${className}`}
      data-visible={isInView}
      style={{ '--path-length': pathLength, animationDelay: `${delay}ms` } as React.CSSProperties}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d={`M2 5 Q${width * 0.25} 2, ${width * 0.5} 5 T${width - 2} 4`}
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength}
      />
    </svg>
  );
}
