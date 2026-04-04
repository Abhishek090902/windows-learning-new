import { useEffect, useRef, useState } from 'react';

export function useScrollReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 900);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(el);
    return () => {
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [threshold]);

  return { ref, isVisible };
}
