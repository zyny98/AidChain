'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import FrameScroller from '../components/scroller/FrameScroller';
import { ScrollSnap } from '../components/scroller/ScrollSnap';
import { PuzzleStageBlock, PUZZLE_STAGES } from '../components/site/PuzzleStage';
import { RevealText } from '../components/site/Reveal';
import { StageRail } from '../components/site/StageRail';
import { Simulation } from '../components/site/Simulation';
import { AudienceBlock } from '../components/site/AudienceBlock';
import { MetricsBlock } from '../components/site/MetricsBlock';
import { SecurityBlock } from '../components/site/SecurityBlock';
import { FaqAccordion } from '../components/site/FaqAccordion';
import Footer20 from '../components/ui/footer-20';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  NavbarLogo,
} from '../components/ui/resizable-navbar';

const RAIL = [
  { id: 'stage-intro', label: 'Начало' },
  { id: 'stage-donor', label: 'Донор' },
  { id: 'stage-escrow', label: 'Эскроу' },
  { id: 'stage-oracle', label: 'Оракул' },
  { id: 'stage-logistics', label: 'Доставка' },
  { id: 'stage-beneficiary', label: 'Получатели' },
];

const NAV_ITEMS = [
  { name: 'Как это работает', link: '#stage-donor' },
  { name: 'Симуляция', link: '#simulation' },
  { name: 'Безопасность', link: '#security' },
  { name: 'Вопросы', link: '#faq' },
];

export default function HomePage() {
  const heroBgRef = useRef<HTMLDivElement>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    let animId: number;
    const updateHeroOpacity = () => {
      if (heroBgRef.current) {
        const y = window.scrollY || window.pageYOffset || 0;
        const winH = window.innerHeight || 800;
        // Smoothly dissolve hero cosmic horizon into pure ink as user scrolls into Stage 1
        const fadeDist = winH * 0.7;
        const progress = Math.min(1, Math.max(0, y / fadeDist));
        const opacity = 1 - progress * progress;
        heroBgRef.current.style.opacity = opacity.toFixed(3);
        heroBgRef.current.style.visibility = opacity <= 0.005 ? 'hidden' : 'visible';
      }
      animId = requestAnimationFrame(updateHeroOpacity);
    };

    animId = requestAnimationFrame(updateHeroOpacity);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative min-h-screen bg-ink">
      <ScrollSnap />
      <FrameScroller />

      {/* Original Cosmic Horizon Hero Background with smooth scroll crossfade */}
      <div
        ref={heroBgRef}
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden will-change-[opacity]"
        style={{ opacity: 1 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-bg.jpg"
          alt="AidChain Cosmic Horizon"
          className="w-full h-full object-cover object-center select-none"
        />

        {/* Lateral shadow gradients on the left & right */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-transparent to-ink/90" />

        {/* Top shadow gradient behind navigation bar */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-ink via-ink/60 to-transparent" />

        {/* Bottom deep atmospheric gradient into ink */}
        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-ink via-ink/80 to-transparent" />

        {/* Soft radial vignette */}
        <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-ink/10 to-ink/60" />
      </div>

      <StageRail items={RAIL} />

      {/* Dynamic Island Resizable Navbar */}
      <Navbar scrollThreshold={70} className="pt-3 sm:pt-4 px-4 sm:px-6">
        {/* Desktop floating navbar: smoothly resizes into compact dynamic island on scroll */}
        <NavBody>
          <NavbarLogo text="AidChain" href="#stage-intro" />
          <NavItems items={NAV_ITEMS} />
          <div className="relative z-20 shrink-0 flex items-center gap-3">
            <Link
              href="/app"
              className="rounded-xl border border-cyan/40 bg-cyan/10 px-3.5 py-1.5 text-[12px] font-semibold text-cyan hover:bg-cyan/20 transition-all shadow-sm shadow-cyan/10 whitespace-nowrap"
            >
              Личные кабинеты →
            </Link>
          </div>
        </NavBody>

        {/* Mobile responsive floating navbar */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo text="AidChain" href="#stage-intro" />
            <MobileNavToggle
              isOpen={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileNavOpen}
            onClose={() => setIsMobileNavOpen(false)}
          >
            {NAV_ITEMS.map((item, idx) => (
              <a
                key={`mobile-nav-${idx}`}
                href={item.link}
                onClick={() => setIsMobileNavOpen(false)}
                className="block w-full py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {item.name}
              </a>
            ))}
            <div className="w-full pt-3 mt-1 border-t border-white/[0.08]">
              <Link
                href="/app"
                onClick={() => setIsMobileNavOpen(false)}
                className="w-full block text-center rounded-xl border border-cyan/40 bg-cyan/15 px-4 py-2.5 text-xs font-semibold text-cyan hover:bg-cyan/25 transition-all"
              >
                Личные кабинеты →
              </Link>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main className="relative z-10">
        {/* Hero Section: Cosmic background, balanced headline, clean sans subtitle, single secondary CTA */}
        <section
          id="stage-intro"
          className="relative flex min-h-[100svh] flex-col justify-end px-6 pb-12 sm:px-10 sm:pb-16 lg:px-16"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-3xl">
              <RevealText
                as="h1"
                immediate
                stagger={60}
                delay={100}
                text="Каждый доллар помощи доходит с чеком"
                className="font-display text-[clamp(2.1rem,4.4vw,4.2rem)] font-light leading-[1.08] tracking-[-0.025em] text-paper [text-wrap:balance]"
              />

              {/* Subtitle: Clean sans, muted, 18-20px, line-height 1.6 */}
              <p className="mt-6 max-w-[34rem] font-sans text-[18px] sm:text-[20px] font-normal not-italic leading-[1.6] text-paper/75">
                Фонд больше не может снять всю сумму разом или подделать накладную. Смарт-контракт выдаёт средства строго траншами и только после проверки чека оракулом.
              </p>

              {/* Secondary button: "К первому этапу" */}
              <div className="mt-8 flex items-center">
                <a
                  href="#stage-donor"
                  className="group inline-flex items-center gap-3 text-[15px] text-paper/85 hover:text-signal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal rounded-full"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-paper/25 transition-colors group-hover:border-signal group-hover:text-signal">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-[nudge_1.8s_ease-in-out_infinite]">
                      <path d="M7 1v11m0 0L2.5 7.5M7 12l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>К первому этапу</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 5 Storytelling Stages with 3D Puzzle Animation (ending cleanly on Beneficiary) */}
        {PUZZLE_STAGES.map((s) => (
          <PuzzleStageBlock key={s.id} stage={s} />
        ))}

        {/* Ecosystem & Beneficiaries ("Для кого") */}
        <AudienceBlock />

        {/* Quantitative Metrics & Counters */}
        <MetricsBlock />

        {/* Smart Contract Security & Guarantees */}
        <SecurityBlock />

        {/* Interactive Simulation Section */}
        <section
          id="simulation"
          className="relative z-10 border-t border-paper/5 bg-ink py-24 sm:py-28"
        >
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
            <div className="mb-12 max-w-2xl">
              <p className="text-[13px] font-mono uppercase tracking-widest text-cyan mb-3">
                Интерактивный тест
              </p>
              <RevealText
                as="h2"
                text="Проведите перевод сами"
                className="font-display text-[clamp(1.75rem,3.4vw,2.9rem)] font-light leading-[1.12] text-paper mb-4"
              />
              <p className="font-sans text-[17px] text-paper/70 leading-[1.6]">
                Попробуйте отправить средства или включить симуляцию завышенного чека. Смарт-контракт отреагирует в реальном времени.
              </p>
            </div>
            <Simulation />
          </div>
        </section>

        {/* FAQ Accordion with clean TODO markers */}
        <FaqAccordion />
      </main>

      {/* Footer 20: Aligned Grid, Demo Version Status & Perfectly Scaled Vector Wordmark */}
      <Footer20 />
    </div>
  );
}
