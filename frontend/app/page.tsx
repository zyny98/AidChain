'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import FrameScroller from '../components/scroller/FrameScroller';
import { PuzzleStageBlock, PUZZLE_STAGES } from '../components/site/PuzzleStage';
import { RevealText } from '../components/site/Reveal';
import { StageRail } from '../components/site/StageRail';
import { Simulation } from '../components/site/Simulation';
import { AudienceBlock } from '../components/site/AudienceBlock';
import { MetricsBlock } from '../components/site/MetricsBlock';
import { SecurityBlock } from '../components/site/SecurityBlock';
import { FaqAccordion } from '../components/site/FaqAccordion';
import Footer20 from '../components/ui/footer-20';
import { useLanguage } from '../components/providers/LanguageProvider';
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

export default function HomePage() {
  const { language, setLanguage } = useLanguage();
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

  const railItems = [
    { id: 'stage-intro', label: language === 'ru' ? 'Начало' : 'Intro' },
    { id: 'stage-donor', label: language === 'ru' ? 'Донор' : 'Donor' },
    { id: 'stage-escrow', label: language === 'ru' ? 'Эскроу' : 'Escrow' },
    { id: 'stage-oracle', label: language === 'ru' ? 'Оракул' : 'Oracle' },
    { id: 'stage-logistics', label: language === 'ru' ? 'Доставка' : 'Logistics' },
    { id: 'stage-beneficiary', label: language === 'ru' ? 'Получатели' : 'Beneficiaries' },
  ];

  const navItems = [
    { name: language === 'ru' ? 'Как это работает' : 'How It Works', link: '#stage-donor' },
    { name: language === 'ru' ? 'Симуляция' : 'Simulation', link: '#simulation' },
    { name: language === 'ru' ? 'Безопасность' : 'Security', link: '#security' },
    { name: language === 'ru' ? 'Вопросы' : 'FAQ', link: '#faq' },
  ];

  return (
    <div className="relative min-h-screen bg-ink">
      {/* 3D Frame Scroller canvas responding smoothly to native window scroll */}
      <FrameScroller />

      {/* Cosmic Horizon Hero Background with smooth scroll crossfade */}
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

      <StageRail items={railItems} />

      {/* Dynamic Island Resizable Navbar */}
      <Navbar scrollThreshold={70} className="pt-3 sm:pt-4 px-4 sm:px-6">
        {/* Desktop floating navbar */}
        <NavBody>
          <NavbarLogo text="AidChain" href="#stage-intro" />
          <NavItems items={navItems} />

          <div className="relative z-20 shrink-0 flex items-center gap-3">
            {/* Animated Smooth Language Switcher (RU / EN) */}
            <div className="relative flex items-center p-0.5 rounded-xl border border-white/[0.12] bg-white/[0.04] backdrop-blur-md">
              <button
                type="button"
                onClick={() => setLanguage('ru')}
                className={`relative px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg transition-colors z-10 ${
                  language === 'ru' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Русский язык"
              >
                {language === 'ru' && (
                  <motion.div
                    layoutId="landing-lang-indicator"
                    className="absolute inset-0 rounded-lg bg-white/[0.16] border border-white/20 shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10">RU</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`relative px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg transition-colors z-10 ${
                  language === 'en' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="English language"
              >
                {language === 'en' && (
                  <motion.div
                    layoutId="landing-lang-indicator"
                    className="absolute inset-0 rounded-lg bg-white/[0.16] border border-white/20 shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10">EN</span>
              </button>
            </div>

            <Link
              href="/app"
              className="rounded-xl border border-cyan/40 bg-cyan/10 px-3.5 py-1.5 text-[12px] font-semibold text-cyan hover:bg-cyan/20 transition-all shadow-sm shadow-cyan/10 whitespace-nowrap"
            >
              {language === 'ru' ? 'Личные кабинеты →' : 'Workspaces →'}
            </Link>
          </div>
        </NavBody>

        {/* Mobile responsive floating navbar */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo text="AidChain" href="#stage-intro" />
            <div className="flex items-center gap-2">
              {/* Mobile Smooth Language Switcher */}
              <div className="flex items-center p-0.5 rounded-lg border border-white/[0.12] bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setLanguage('ru')}
                  className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded transition-colors ${
                    language === 'ru' ? 'bg-white/20 text-white' : 'text-slate-400'
                  }`}
                >
                  RU
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded transition-colors ${
                    language === 'en' ? 'bg-white/20 text-white' : 'text-slate-400'
                  }`}
                >
                  EN
                </button>
              </div>

              <MobileNavToggle
                isOpen={isMobileNavOpen}
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileNavOpen}
            onClose={() => setIsMobileNavOpen(false)}
          >
            {navItems.map((item, idx) => (
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
                {language === 'ru' ? 'Личные кабинеты →' : 'Workspaces →'}
              </Link>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main className="relative z-10">
        {/* Hero Section */}
        <section
          id="stage-intro"
          className="relative flex min-h-[100svh] flex-col justify-end px-6 pb-12 sm:px-10 sm:pb-16 lg:px-16"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-3xl">
              <RevealText
                key={`hero-title-${language}`}
                as="h1"
                immediate
                stagger={60}
                delay={100}
                text={
                  language === 'ru'
                    ? 'Каждый доллар помощи доходит с чеком'
                    : 'Every dollar of aid arrives with a receipt'
                }
                className="font-display text-[clamp(2.1rem,4.4vw,4.2rem)] font-light leading-[1.08] tracking-[-0.025em] text-paper [text-wrap:balance]"
              />

              {/* Subtitle */}
              <p className="mt-6 max-w-[34rem] font-sans text-[18px] sm:text-[20px] font-normal not-italic leading-[1.6] text-paper/75">
                {language === 'ru'
                  ? 'Фонд больше не может снять всю сумму разом или подделать накладную. Смарт-контракт выдаёт средства строго траншами и только после проверки чека оракулом.'
                  : 'The foundation can no longer withdraw the entire sum at once or forge an invoice. The smart contract releases funds strictly in tranches and only after oracle receipt verification.'}
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
                  <span>{language === 'ru' ? 'К первому этапу' : 'To the first stage'}</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 5 Storytelling Stages with 3D Puzzle Animation */}
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
                {language === 'ru' ? 'Интерактивный тест' : 'Interactive Test'}
              </p>
              <RevealText
                key={`sim-title-${language}`}
                as="h2"
                text={language === 'ru' ? 'Проведите перевод сами' : 'Simulate a Transfer Yourself'}
                className="font-display text-[clamp(1.75rem,3.4vw,2.9rem)] font-light leading-[1.12] text-paper mb-4"
              />
              <p className="font-sans text-[17px] text-paper/70 leading-[1.6]">
                {language === 'ru'
                  ? 'Попробуйте отправить средства или включить симуляцию завышенного чека. Смарт-контракт отреагирует в реальном времени.'
                  : 'Try sending funds or simulate an overpriced invoice. The smart contract responds in real time.'}
              </p>
            </div>
            <Simulation />
          </div>
        </section>

        {/* FAQ Accordion */}
        <FaqAccordion />
      </main>

      {/* Footer 20 */}
      <Footer20 />
    </div>
  );
}
