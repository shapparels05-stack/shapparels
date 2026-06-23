"use client";

import { useEffect, useRef, useState } from "react";

interface DeferUntilVisibleProps {
  children: React.ReactNode;
  /** Pre-load this far before the section enters the viewport. */
  rootMargin?: string;
  /** Space reserved before content mounts, to limit layout shift. */
  minHeight?: number;
}

/**
 * Renders a light placeholder until the wrapper scrolls near the viewport, then
 * mounts (and hydrates) its children. Used to keep heavy below-the-fold client
 * carousels off the initial main-thread budget — they hydrate only when needed.
 *
 * Children are still rendered on the server (data is fetched at request time);
 * only their client-side hydration is deferred.
 */
export function DeferUntilVisible({
  children,
  rootMargin = "600px 0px",
  minHeight = 500,
}: DeferUntilVisibleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}
