'use client';

import React, { useEffect, useState } from 'react';

export interface RailItem {
  id: string;
  label: string;
}

export function StageRail({ items }: { items: RailItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const [inStagesZone, setInStagesZone] = useState(true);

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter(Boolean) as HTMLElement[];

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  useEffect(() => {
    const checkZone = () => {
      const lastStage = document.getElementById('stage-beneficiary');
      if (lastStage) {
        const rect = lastStage.getBoundingClientRect();
        setInStagesZone(rect.bottom > 60);
      }
    };
    window.addEventListener('scroll', checkZone, { passive: true });
    checkZone();
    return () => window.removeEventListener('scroll', checkZone);
  }, []);

  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.id === active)
  );

  return (
    <>
      {/* Mobile top progress bar (screen width < lg) */}
      <div
        aria-hidden
        className={`fixed top-[57px] inset-x-0 z-30 h-[2px] bg-paper/10 lg:hidden pointer-events-none transition-opacity duration-300 ${
          inStagesZone ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="h-full bg-emerald-400 transition-all duration-300"
          style={{
            width: `${((activeIndex + 1) / items.length) * 100}%`,
          }}
        />
      </div>

      {/* Desktop vertical stage rail (>= lg) */}
      <nav
        aria-label="Этапы пути"
        className={`fixed right-4 xl:right-6 top-1/2 z-30 hidden -translate-y-1/2 lg:block transition-all duration-500 ${
          inStagesZone ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
      >
        <ol className="relative flex flex-col gap-5">
          {/* Track line behind dots */}
          <span className="absolute right-[3px] top-1 bottom-1 w-px bg-paper/15" />
          <span
            className="absolute right-[3px] top-1 w-px bg-signal transition-[height] duration-500 ease-out"
            style={{
              height: `calc(${(activeIndex / (items.length - 1)) * 100}% - 0.25rem)`,
            }}
          />
          {items.map((item) => {
            const on = item.id === active;
            return (
              <li key={item.id} className="relative flex items-center justify-end gap-3">
                {/* On lg: hide label to avoid text collision, on xl: show label */}
                <a
                  href={`#${item.id}`}
                  aria-label={`Перейти к этапу: ${item.label}`}
                  className={`hidden xl:inline text-[12px] tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal rounded px-1 ${
                    on
                      ? 'translate-x-0 text-paper opacity-100 font-medium'
                      : 'translate-x-1 text-paper/45 opacity-70 hover:text-paper hover:opacity-100'
                  }`}
                >
                  {item.label}
                </a>
                <a
                  href={`#${item.id}`}
                  aria-label={item.label}
                  className="group relative flex items-center justify-center p-1"
                >
                  <span
                    className={`relative z-10 h-[7px] w-[7px] rounded-full border transition-all duration-300 ${
                      on
                        ? 'scale-125 border-signal bg-signal shadow-[0_0_12px_#4d8bff]'
                        : 'border-paper/40 bg-ink group-hover:border-paper'
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
