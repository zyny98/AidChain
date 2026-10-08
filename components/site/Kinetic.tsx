'use client';

import React, { useEffect, useRef, useState } from 'react';

interface KineticProps {
  /** Small step index, e.g. "01". */
  index: string;
  /** Short category subtitle, e.g. "Входящий поток". */
  category?: string;
  /** Stack of words/phrases animated with the kinetic wave. */
  lines: string[];
  align?: 'left' | 'right';
}

/**
 * High-end Kinetic Typography wave animation matching the Jitter motion-design reference.
 * Pure typography, no cards, no borders.
 * Each word smoothly pushes horizontally and illuminates from dim grey to bright glowing white,
 * creating a continuous travelling wave ripple down the column.
 */
export function Kinetic({
  index,
  category,
  lines,
  align = 'left',
}: KineticProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const right = align === 'right';

  // Pause animation when off-screen to save performance
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting && entry.intersectionRatio > 0.35);
      },
      { threshold: [0, 0.35, 0.7, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 3D perspective mouse tilt
  useEffect(() => {
    const tilt = tiltRef.current;
    if (!tilt) return;
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tilt.style.transform = `rotateY(${nx * 12}deg) rotateX(${-ny * 8}deg)`;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Shift direction: push inward towards center 3D scene
  // left-aligned text pushes right (+), right-aligned text pushes left (-)
  const shiftSign = right ? -1 : 1;

  return (
    <div
      ref={rootRef}
      className={`kinetic-container select-none ${
        right ? 'ml-auto text-right' : 'mr-auto text-left'
      }`}
      style={{
        perspective: '1200px',
        maxWidth: '52rem',
      }}
    >
      <div
        ref={tiltRef}
        className="transition-transform duration-500 ease-out"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Minimalist mono index label - no boxes, pure editorial typography */}
        <div
          className={`mb-6 flex items-center gap-3 font-mono text-[13px] tracking-[0.25em] text-paper/50 ${
            right ? 'justify-end' : 'justify-start'
          }`}
        >
          <span className="text-signal/80 font-semibold">{index}</span>
          <span className="text-paper/20">/</span>
          <span className="uppercase text-paper/45">{category}</span>
        </div>

        {/* Word stack with Jitter wave animation */}
        <div
          className={`flex flex-col gap-1 sm:gap-2 ${
            right ? 'items-end' : 'items-start'
          }`}
        >
          {lines.map((line, i) => {
            return (
              <div
                key={i}
                className="kinetic-word-row group relative inline-block cursor-default"
                style={
                  {
                    '--shift': `${shiftSign * 58}px`,
                    '--shift-mobile': `${shiftSign * 28}px`,
                    animationDelay: `${i * 0.22}s`,
                    animationPlayState: inView ? 'running' : 'paused',
                  } as React.CSSProperties
                }
              >
                <span
                  className="block font-sans text-[clamp(2.4rem,5.6vw,5.4rem)] font-bold leading-[0.98] tracking-[-0.035em] text-paper transition-all duration-300"
                  style={{
                    textShadow:
                      '0 2px 24px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {line}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
