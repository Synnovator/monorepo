'use client';

import { useEffect, useRef, useState } from 'react';

export function useInView<T extends Element = HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.3, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}
