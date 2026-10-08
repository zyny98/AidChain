'use client';

import React, { useEffect, useState, useRef } from 'react';

export interface StaircaseStep {
  step: string;
  label: string;
  baseOffset: number; // base staircase indent in px
}

export const STAIRCASE_STEPS: StaircaseStep[] = [
  { step: '01', label: 'Донор в сети', baseOffset: 0 },
  { step: '02', label: 'Смарт-контракт USDC', baseOffset: 32 },
  { step: '03', label: 'Поэтапный эскроу', baseOffset: 64 },
  { step: '04', label: 'Разморозка траншей', baseOffset: 96 },
  { step: '05', label: 'AI-аудит чеков', baseOffset: 64 },
  { step: '06', label: 'Контроль логистики', baseOffset: 32 },
  { step: '07', label: 'Цифровой акт склада', baseOffset: 64 },
  { step: '08', label: 'Помощь семьям ZK', baseOffset: 96 },
  { step: '09', label: 'Реестр Polygon L2', baseOffset: 64 },
];

export const CHAIN_STAGES = [
  { id: 'stage-donor', step: '01', category: 'Входящий поток' },
  { id: 'stage-escrow', step: '02', category: 'Смарт-защита' },
  { id: 'stage-oracle', step: '03', category: 'AI-Аудит чеков' },
  { id: 'stage-logistics', step: '04', category: 'Логистика' },
  { id: 'stage-beneficiary', step: '05', category: 'Получатели' },
  { id: 'stage-conclusion', step: '06', category: 'Верификация' },
];

/**
 * Continuous Unbroken Kinetic Staircase ("Лестница туда-сюда"):
 * - The text NEVER disappears from the screen during the entire 3D sequence.
 * - Words are arranged as a staircase stepping back and forth ("туда-сюда").
 * - Animation triggers with scroll and stays in solid, opaque white (#ffffff, opacity: 1).
 * - Smaller, comfortable typography that is pleasant to read.
 */
export function KineticChain() {
  const [activeFloat, setActiveFloat] = useState<number>(0);
  const [globalOpacity, setGlobalOpacity] = useState<number>(0);
  const rangeRef = useRef<{ startY: number; endY: number }>({ startY: 0, endY: 1 });

  useEffect(() => {
    let animId: number;

    const measureRange = () => {
      const halfWin = window.innerHeight / 2;
      const currentScroll = window.scrollY || window.pageYOffset || 0;

      const firstEl = document.getElementById('stage-donor');
      const lastEl = document.getElementById('stage-conclusion');

      let startY = 800;
      let endY = 4800;

      if (firstEl) {
        const r = firstEl.getBoundingClientRect();
        startY = r.top + currentScroll + r.height / 2 - halfWin;
      }
      if (lastEl) {
        const r = lastEl.getBoundingClientRect();
        endY = r.top + currentScroll + r.height / 2 - halfWin;
      }

      rangeRef.current = { startY, endY: Math.max(startY + 500, endY) };
    };

    measureRange();
    window.addEventListener('resize', measureRange);

    const onScroll = () => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      const { startY, endY } = rangeRef.current;
      const halfWin = window.innerHeight / 2;

      // Global visibility: fades in after Hero, stays 100% visible throughout 3D sequence, fades out at Simulation
      if (currentY < startY - halfWin * 0.85) {
        setGlobalOpacity(0);
      } else if (currentY < startY - 40) {
        const f = (currentY - (startY - halfWin * 0.85)) / (halfWin * 0.85 - 40);
        setGlobalOpacity(Math.max(0, Math.min(1, f)));
      } else if (currentY > endY + halfWin * 0.8) {
        setGlobalOpacity(0);
      } else if (currentY > endY + 40) {
        const f = 1 - (currentY - (endY + 40)) / (halfWin * 0.8 - 40);
        setGlobalOpacity(Math.max(0, Math.min(1, f)));
      } else {
        setGlobalOpacity(1);
      }

      // Smooth progress from 0.0 to 8.0
      const totalSteps = STAIRCASE_STEPS.length - 1;
      const ratio = Math.max(0, Math.min(1, (currentY - startY) / Math.max(1, endY - startY)));
      setActiveFloat(ratio * totalSteps);

      animId = requestAnimationFrame(onScroll);
    };

    animId = requestAnimationFrame(onScroll);

    return () => {
      window.removeEventListener('resize', measureRange);
      cancelAnimationFrame(animId);
    };
  }, []);

  if (globalOpacity <= 0.01) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-20 pointer-events-none select-none transition-opacity duration-300 flex items-center"
      style={{ opacity: globalOpacity }}
      aria-hidden="true"
    >
      <div className="relative mx-auto w-full max-w-7xl px-6 sm:px-12 lg:px-20">
        {/* Continuous Staircase Column (Never disappears from screen) */}
        <div
          className="pointer-events-auto flex flex-col gap-1.5 sm:gap-2.5 transition-transform duration-300"
          style={{ maxWidth: '36rem' }}
        >
          {/* Subtle chain header */}
          <div className="mb-2 flex items-center gap-2.5 font-mono text-[11px] tracking-[0.25em] text-paper/50 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
            <span>AidChain // Непрерывная цепь протокола</span>
          </div>

          {STAIRCASE_STEPS.map((item, i) => {
            const dist = activeFloat - i;
            const absDist = Math.abs(dist);

            // Active when wave passes
            const isActive = absDist < 0.75;
            // Passed steps stay solid opaque white (#ffffff, opacity: 1)
            const isPassed = activeFloat >= i - 0.25;

            // Staircase wave boost: active item pushes out like the wave in Scene.mp4
            const waveBoost = Math.max(0, 1 - absDist * 1.35) * 32;
            const totalX = item.baseOffset + waveBoost;

            return (
              <div
                key={item.step}
                className="group relative flex items-center gap-3 transition-transform duration-150 ease-out"
                style={{
                  transform: `translateX(${totalX}px)`,
                }}
              >
                {/* Step indicator node */}
                <span
                  className={`font-mono text-[12px] tracking-wider transition-all duration-300 ${
                    isActive
                      ? 'text-signal font-bold scale-110'
                      : isPassed
                      ? 'text-paper/70 font-medium'
                      : 'text-paper/25'
                  }`}
                >
                  {item.step}
                </span>

                <span
                  className={`h-px transition-all duration-300 ${
                    isActive
                      ? 'w-6 bg-signal shadow-[0_0_8px_#4d8bff]'
                      : isPassed
                      ? 'w-3.5 bg-paper/30'
                      : 'w-2 bg-paper/10'
                  }`}
                />

                {/* Staircase text word: smaller comfortable size, solid opaque white when reached */}
                <span
                  className={`font-sans text-[clamp(1.25rem,2.4vw,2.15rem)] font-bold leading-[1.08] tracking-[-0.03em] transition-all duration-200 ${
                    isActive
                      ? 'text-white scale-[1.02]'
                      : isPassed
                      ? 'text-white'
                      : 'text-paper/30 hover:text-paper/60'
                  }`}
                  style={{
                    color: isPassed ? '#ffffff' : undefined,
                    opacity: isPassed ? 1 : 0.35,
                    textShadow: isActive
                      ? '0 0 28px rgba(255, 255, 255, 0.45), 0 2px 24px rgba(0, 0, 0, 0.95)'
                      : isPassed
                      ? '0 2px 20px rgba(0, 0, 0, 0.95), 0 0 2px rgba(0, 0, 0, 0.8)'
                      : 'none',
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
