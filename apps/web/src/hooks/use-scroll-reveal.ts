import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to a container element.
 * All descendants with the `reveal` class get `reveal-visible` added
 * when they scroll into view. Supports `data-delay` for staggered reveals.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const elements = container.querySelectorAll<HTMLElement>(".reveal");
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay;
            if (delay) {
              el.style.transitionDelay = `${delay}ms`;
            }
            el.classList.add("reveal-visible");
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.15 }
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}
