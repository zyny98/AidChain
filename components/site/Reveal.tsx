'use client';

import React, { useEffect, useRef, useState } from 'react';

interface RevealTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  /** ms between words */
  stagger?: number;
  /** ms before the first word */
  delay?: number;
  /** play immediately on mount (hero) instead of waiting for viewport */
  immediate?: boolean;
}

/**
 * Words rise out of a clipped line and sharpen from a blur.
 * Plays once. Respects prefers-reduced-motion via CSS in globals.css.
 */
export function RevealText({
  text,
  as: Tag = 'h2',
  className = '',
  stagger = 55,
  delay = 0,
  immediate = false,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (immediate) {
      const t = setTimeout(() => setShown(true), 120);
      return () => clearTimeout(t);
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  const words = text.split(' ');

  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden
          className="reveal-mask inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]"
        >
          <span
            className="reveal-word inline-block will-change-transform"
            data-shown={shown}
            style={{ transitionDelay: `${delay + i * stagger}ms` }}
          >
            {w}
            {i < words.length - 1 ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </Tag>
  );
}
