'use client';

import React from 'react';

const SIDE_PILLARS = [
  {
    title: 'Гарантированный возврат (Timelock)',
    desc: 'Если поставщик не привёз товар или попытался завысить цену, неиспользованный баланс автоматически возвращается донору.',
  },
  {
    title: 'Криптографическая верификация',
    desc: 'Каждый чек и акт приёмки хэшируется (SHA-256) и записывается в блокчейн. Подделать задним числом невозможно.',
  },
  {
    title: 'ZK-приватность получателей',
    desc: 'Нуждающиеся подтверждают факт получения криптографическим доказательством с нулевым разглашением. Личные данные не светятся в сети.',
  },
];

export function SecurityBlock() {
  return (
    <section id="security" className="relative z-10 py-24 sm:py-28 bg-[#080b11] border-t border-white/[0.06] font-sans">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mb-14 max-w-2xl">
          <p className="text-[12px] font-mono uppercase tracking-widest text-emerald-400 mb-3">
            Архитектура безопасности
          </p>
          <h2 className="font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-light leading-[1.12] text-white mb-4 tracking-tight">
            Почему смарт-контракту можно доверять
          </h2>
          <p className="font-sans text-[16px] text-slate-300 leading-[1.6]">
            В традиционной благотворительности всё держится на честном слове управляющего. В AidChain правила прописаны в открытом коде.
          </p>
        </div>

        {/* Bento Grid: Featured Square Card on the left, 3 side cards on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* First Block: Square Featured Card */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-[#121827] p-8 sm:p-10 shadow-sm min-h-[340px] lg:min-h-full">
            <div>
              <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V11C20 9.89543 19.1046 9 18 9H6C4.89543 9 4 9.89543 4 11V19C4 20.1046 4.89543 21 6 21ZM16 9V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V9H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h3 className="font-display text-[24px] sm:text-[28px] font-medium text-white leading-tight mb-4 tracking-tight">
                Non-custodial эскроу
              </h3>
            </div>

            <p className="font-sans text-[15px] sm:text-[16px] text-slate-300 leading-[1.65]">
              Фонд не имеет приватных ключей для снятия всей суммы. Деньги выдаются смарт-контрактом строго транш за траншем после подтверждения отчётов.
            </p>
          </div>

          {/* Remaining 3 blocks: Stacked cleanly on the right side */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            {SIDE_PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-white/[0.08] bg-[#121827] p-6 sm:p-7 flex flex-col justify-center transition-all duration-300 hover:border-white/[0.15]"
              >
                <h4 className="font-display text-[17px] sm:text-[18px] font-medium text-white mb-2">
                  {p.title}
                </h4>
                <p className="font-sans text-[14px] sm:text-[15px] text-slate-300 leading-[1.6]">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
