'use client';

import React from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export function AudienceBlock() {
  const { language } = useLanguage();

  const audiences = [
    {
      role: language === 'ru' ? 'Донор' : 'Donor',
      benefit:
        language === 'ru'
          ? 'Видит каждый цент перевода и точно знает, что деньги не ушли на посторонние счета.'
          : 'Tracks every cent of the contribution and knows funds never leak to unauthorized accounts.',
      linkText: language === 'ru' ? 'Кабинет донора' : 'Donor Workspace',
      href: '/app/donor',
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-cyan">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      role: language === 'ru' ? 'Фонд' : 'Foundation',
      benefit:
        language === 'ru'
          ? 'Снимает любые подозрения в растрате благодаря автоматическим открытым крипто-доказательствам.'
          : 'Clears any misappropriation doubts with automated, public cryptographic proof of aid.',
      linkText: language === 'ru' ? 'Кабинет фонда' : 'Foundation Portal',
      href: '/app/foundation',
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-signal">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      role: language === 'ru' ? 'Поставщик' : 'Supplier',
      benefit:
        language === 'ru'
          ? 'Получает гарантированную быструю оплату траншами сразу после сверки чека и накладной.'
          : 'Receives guaranteed fast tranche payments immediately after invoice and receipt validation.',
      linkText: language === 'ru' ? 'Кабинет поставщика' : 'Supplier Portal',
      href: '/app/vendor',
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-violet">
          <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <section id="audience" className="relative z-10 py-24 sm:py-28 bg-ink border-t border-paper/5">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mb-14">
          <p className="text-[13px] font-mono uppercase tracking-widest text-cyan mb-3">
            {language === 'ru' ? 'Экосистема протокола' : 'Protocol Ecosystem'}
          </p>
          <h2 className="font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-light leading-[1.12] text-paper">
            {language === 'ru' ? 'Для кого создан AidChain' : 'Who AidChain Is Built For'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {audiences.map((item) => (
            <div
              key={item.role}
              className="relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#121827] p-7 sm:p-8 transition-all duration-300 hover:border-emerald-500/40 shadow-sm group"
            >
              <div>
                {/* Top Row: Large Icon + Big White Title */}
                <div className="flex items-center gap-5 mb-5">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-white/[0.1] bg-[#090d16] text-emerald-400 shadow-inner transition-transform group-hover:scale-105">
                    {item.icon}
                  </div>
                  <h3 className="font-display text-[24px] sm:text-[26px] font-medium text-white tracking-tight">
                    {item.role}
                  </h3>
                </div>

                {/* Subtitle / Detailed explanation text below */}
                <p className="font-sans text-[15px] sm:text-[16px] text-slate-300 leading-[1.65]">
                  {item.benefit}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.06]">
                <a
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-white transition-colors"
                >
                  <span>{item.linkText}</span>
                  <span className="text-emerald-400 group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
