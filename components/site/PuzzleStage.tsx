'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PuzzleCharItemProps {
  char: string;
  charIndex: number;
  centerIndex: number;
  isInView: boolean;
  baseDelay?: number;
  spread?: number;
  rotateAngle?: number;
}

/**
 * Character that assembles like a 3D puzzle from scratch (slowed down and clearly visible)
 */
function PuzzleCharItem({
  char,
  charIndex,
  centerIndex,
  isInView,
  baseDelay = 0,
  spread = 20,
  rotateAngle = 14,
}: PuzzleCharItemProps) {
  const distanceFromCenter = charIndex - centerIndex;
  // Spatial offset seed balanced with faster snap timing
  const seedY = (charIndex % 3 === 0 ? -16 : charIndex % 2 === 0 ? 14 : -8);
  const seedZ = -90 - Math.abs(distanceFromCenter) * 8;
  const seedRotateZ = (charIndex % 2 === 0 ? 12 : -12);

  return (
    <motion.span
      className="inline-block will-change-transform"
      initial={{
        opacity: 0,
        x: distanceFromCenter * spread + (charIndex % 2 === 0 ? 10 : -10),
        y: seedY,
        z: seedZ,
        rotateX: distanceFromCenter * rotateAngle,
        rotateY: -distanceFromCenter * (rotateAngle * 1.1),
        rotateZ: seedRotateZ,
        scale: 0.55,
        filter: 'blur(5px)',
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              x: 0,
              y: 0,
              z: 0,
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              scale: 1,
              filter: 'blur(0px)',
            }
          : {
              opacity: 0,
              x: distanceFromCenter * spread + (charIndex % 2 === 0 ? 10 : -10),
              y: seedY,
              z: seedZ,
              rotateX: distanceFromCenter * rotateAngle,
              rotateY: -distanceFromCenter * (rotateAngle * 1.1),
              rotateZ: seedRotateZ,
              scale: 0.55,
              filter: 'blur(5px)',
            }
      }
      transition={{
        duration: 0.7,
        delay: baseDelay + charIndex * 0.024,
        ease: [0.2, 1, 0.35, 1],
      }}
      style={{
        transformOrigin: 'center center',
        textShadow: '0 2px 24px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.8)',
      }}
    >
      {char}
    </motion.span>
  );
}

/**
 * PuzzleText wraps each word in `whitespace-nowrap` so words NEVER split across syllables!
 */
function PuzzleText({
  text,
  isInView,
  baseDelay = 0,
  spread = 32,
  rotateAngle = 26,
  className,
}: {
  text: string;
  isInView: boolean;
  baseDelay?: number;
  spread?: number;
  rotateAngle?: number;
  className?: string;
}) {
  const words = text.split(' ');
  const allChars = text.split('');
  const centerIndex = Math.floor(allChars.length / 2);

  let globalCharIndex = 0;

  return (
    <span className={cn('inline-block', className)} style={{ perspective: '1200px' }}>
      {words.map((word, wordIndex) => {
        const wordChars = word.split('');
        const startIndex = globalCharIndex;
        globalCharIndex += wordChars.length + 1; // +1 for the space

        return (
          <React.Fragment key={wordIndex}>
            {/* Whole word stays intact: NEVER broken into syllables */}
            <span className="inline-block whitespace-nowrap">
              {wordChars.map((char, charIndex) => {
                const charGlobalIndex = startIndex + charIndex;

                return (
                  <PuzzleCharItem
                    key={charIndex}
                    char={char}
                    charIndex={charGlobalIndex}
                    centerIndex={centerIndex}
                    isInView={isInView}
                    baseDelay={baseDelay}
                    spread={spread}
                    rotateAngle={rotateAngle}
                  />
                );
              })}
            </span>
            {wordIndex < words.length - 1 && (
              <span className="inline-block w-[0.28em]">&nbsp;</span>
            )}
          </React.Fragment>
        );
      })}
    </span>
  );
}

export interface PuzzleStageData {
  id: string;
  title: string;
  subtitle: string;
  rule: string;
  side: 'left' | 'right';
}

export const PUZZLE_STAGES: PuzzleStageData[] = [
  {
    id: 'stage-donor',
    title: 'Деньги сразу в коде',
    subtitle: 'А не на личном счёте',
    rule: 'Сумма блокируется контрактом в первую же секунду. Снять её на личные нужды фонда физически невозможно.',
    side: 'left',
  },
  {
    id: 'stage-escrow',
    title: 'Всю сумму разом не снять',
    subtitle: 'Деньги выдаются частями',
    rule: 'Сначала на закупку, потом на бензин, в конце за раздачу. Если на первом шаге соврали, остаток возвращается донору.',
    side: 'right',
  },
  {
    id: 'stage-oracle',
    title: 'Накрутить чеки не выйдет',
    subtitle: 'Сверка с оптовыми базами',
    rule: 'Нарисовали накладную в фотошопе или купили муку втрое дороже рынка: система сразу блокирует следующий платёж.',
    side: 'left',
  },
  {
    id: 'stage-logistics',
    title: 'Водитель ждёт разгрузки',
    subtitle: 'Расчёт строго у склада',
    rule: 'Деньги за рейс уходят только после того, как кладовщик на месте принял коробки и приложил цифровой ключ.',
    side: 'right',
  },
  {
    id: 'stage-beneficiary',
    title: 'Помощь без унижения',
    subtitle: 'Без фотосессий для отчёта',
    rule: 'Криптография подтверждает, что пакет отдали живому человеку, но его паспорт и лицо никто не выкладывает в сеть.',
    side: 'left',
  },
];

export function PuzzleStageBlock({ stage }: { stage: PuzzleStageData }) {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  // In-view trigger: starts from scratch every time stage enters viewport
  const isInView = useInView(sectionRef, { amount: 0.35, once: false });

  const isRight = stage.side === 'right';

  return (
    <section
      ref={sectionRef}
      id={stage.id}
      className="relative flex min-h-[100svh] items-center px-6 sm:px-10 lg:px-16 pointer-events-none"
    >
      <div className="relative mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div
            className={cn(
              'pointer-events-auto relative w-full transition-all duration-300',
              // Desktop: Col 1-5 (left) or Col 8-12 (right), leaving center strictly open for the cube (>48px clearance)
              isRight
                ? 'lg:col-span-5 lg:col-start-8 lg:text-right pr-2 sm:pr-4 lg:pr-14'
                : 'lg:col-span-5 lg:col-start-1 text-left',
              // Mobile (< 1024px): text is pushed to bottom half so cube stays visible on top
              'pt-72 sm:pt-80 lg:pt-0'
            )}
            style={{ perspective: '1000px' }}
          >
            {/* Main Title: crisp 3D puzzle assembly with magnetic snap */}
            <h2 className="leading-[1.14]">
              <PuzzleText
                text={stage.title}
                isInView={isInView}
                baseDelay={0.03}
                spread={20}
                rotateAngle={14}
                className="font-display text-[clamp(1.75rem,2.4vw,2.5rem)] font-light text-paper tracking-[-0.02em]"
              />
            </h2>

            {/* Subtitle: assembled puzzle piece by piece */}
            <div className="mt-3.5 leading-[1.3]">
              <PuzzleText
                text={stage.subtitle}
                isInView={isInView}
                baseDelay={0.2}
                spread={14}
                rotateAngle={10}
                className="font-sans text-[clamp(1.1rem,1.4vw,1.35rem)] font-medium text-emerald-400 tracking-normal"
              />
            </div>

            {/* Human takeaway explanation */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ duration: 0.55, delay: 0.45, ease: [0.2, 1, 0.35, 1] }}
              className={cn(
                'mt-5 text-[18px] sm:text-[19px] font-sans text-paper/80 leading-[1.6]',
                isRight && 'lg:ml-auto'
              )}
            >
              {stage.rule}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
