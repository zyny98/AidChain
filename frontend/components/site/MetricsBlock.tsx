'use client';

import React from 'react';

const METRICS = [
  {
    value: '100%',
    label: 'Целевое расходование',
    desc: 'Средства переводятся строго после валидации чека',
  },
  {
    value: '0',
    label: 'Возможностей для растраты',
    desc: 'Директор фонда физически не имеет доступа к общему котлу',
  },
  {
    value: '< 3 сек',
    label: 'Время проверки чека',
    desc: 'Автоматическая сверка оптовой цены через AI-оракул',
  },
  {
    value: '3 транша',
    label: 'Дробление гранта',
    desc: 'Закупка, доставка и выдача подтверждаются раздельно',
  },
];

export function MetricsBlock() {
  return (
    <section id="metrics" className="relative z-10 py-20 bg-ink border-t border-paper/5">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
          <div>
            <p className="text-[13px] font-mono uppercase tracking-widest text-cyan mb-2">
              Надёжность в цифрах
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-light leading-[1.15] text-paper">
              Как протокол защищает каждый перевод
            </h2>
          </div>
          <span className="font-mono text-[12px] text-paper/40 border border-paper/10 rounded-full px-3 py-1 self-start sm:self-auto">
            демо-показатели симуляции
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-paper/10 bg-night/40 p-6 flex flex-col justify-between transition-colors hover:border-paper/20"
            >
              {/* Metric Value: whitespace-nowrap and adjusted clamp to prevent wrapping "3 транша" */}
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
