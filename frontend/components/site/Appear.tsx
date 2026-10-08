'use client';

import React, { useEffect, useRef, useState } from 'react';

type Variant = 'up' | 'left' | 'draw';

interface AppearProps {
  children?: React.ReactNode;
  variant?: Variant;
  /** ms */
  delay?: number;
  className?: string;
  as?: 'div' | 'span' | 'li' | 'p';
}

/** One-shot entrance for any block, triggered when it scrolls into view. */
export function Appear({
  children,
  variant = 'up',
  delay = 0,
  className = '',
  as: Tag = 'div',
}: AppearProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`appear ${className}`}
      data-v={variant}
      data-shown={shown}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
