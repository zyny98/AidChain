'use client';

import React from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export function MetricsBlock() {
  const { language } = useLanguage();

  const metrics = [
    {
      value: '100%',
      label: language === 'ru' ? 'Целевое расходование' : 'Target Spending',
      desc:
        language === 'ru'
          ? 'Средства переводятся строго после валидации чека'
          : 'Funds release strictly upon receipt validation',
    },
    {
      value: '0',
      label: language === 'ru' ? 'Возможностей для растраты' : 'Misappropriation Risk',
      desc:
        language === 'ru'
          ? 'Директор фонда физически не имеет доступа к общему котлу'
          : 'The foundation director physically lacks single-key pool access',
    },
    {
      value: language === 'ru' ? '< 3 сек' : '< 3 sec',
      label: language === 'ru' ? 'Время проверки чека' : 'Verification Time',
      desc:
        language === 'ru'
          ? 'Автоматическая сверка оптовой цены через AI-оракул'
          : 'Automated wholesale market cross-check via AI Oracle',
    },
    {
      value: language === 'ru' ? '3 транша' : '3 Tranches',
      label: language === 'ru' ? 'Дробление гранта' : 'Grant Staging',
      desc:
        language === 'ru'
          ? 'Закупка, доставка и выдача подтверждаются раздельно'
          : 'Procurement, logistics, and handover verified separately',
    },
  ];

  return (
    <section id="metrics" className="relative z-10 py-20 bg-ink border-t border-paper/5">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
          <div>
            <p className="text-[13px] font-mono uppercase tracking-widest text-cyan mb-2">
              {language === 'ru' ? 'Надёжность в цифрах' : 'Reliability in Numbers'}
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-light leading-[1.15] text-paper">
              {language === 'ru'
                ? 'Как протокол защищает каждый перевод'
                : 'How the Protocol Protects Every Transfer'}
            </h2>
          </div>
          <span className="font-mono text-[12px] text-paper/40 border border-paper/10 rounded-full px-3 py-1 self-start sm:self-auto">
            {language === 'ru' ? 'демо-показатели симуляции' : 'simulation demo metrics'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-paper/10 bg-night/40 p-6 flex flex-col justify-between transition-colors hover:border-paper/20"
            >
              <div className="font-display text-[clamp(1.6rem,2.3vw,2.4rem)] font-light text-cyan tracking-tight mb-3 whitespace-nowrap">
                {m.value}
              </div>
              <div>
                <h3 className="font-sans font-semibold text-[16px] text-paper mb-1.5">
                  {m.label}
                </h3>
                <p className="font-sans text-[13.5px] text-paper/60 leading-relaxed">
                  {m.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
