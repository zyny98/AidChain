'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqItem {
  q: string;
  a: string;
  todo: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'Какая комиссия взимается за перевод помощи?',
    a: 'Протокол не взимает скрытых процентов с пожертвований. Оплачивается исключительно фактический сетевой сбор (газ) блокчейна, составляющий доли цента.',
    todo: 'подтвердить владельцем точную модель сетевых комиссий и комиссий ретрансляторов.',
  },
  {
    q: 'Что происходит, если поставщик предоставил спорный чек?',
    a: 'Если распознанные цены в чеке превышают среднерыночные по оптовой базе, транш моментально замораживается. Если поставщик не предоставит корректный документ до истечения таймлока, средства автоматически возвращаются донору.',
    todo: 'проверить владельцем регламент арбитража при спорных накладных.',
  },
  {
    q: 'Как защищена приватность получателей помощи?',
    a: 'Никаких унизительных фотосессий или публикации паспортов в интернете. Получатели подтверждают передачу помощи через криптографические ZK-доказательства (Zero-Knowledge): в блокчейн записывается факт выдачи, а личные данные остаются у человека.',
    todo: 'верифицировать владельцем выбранную архитектуру ZK-proofs.',
  },
  {
    q: 'Что произойдёт, если AI-оракул ошибся при распознавании?',
    a: 'Система использует консенсус независимых оракулов. При расхождении в распознавании накладной выплата не уходит вслепую, а приостанавливается до подтверждения резервными узлами валидации.',
    todo: 'уточнить стек децентрализованных оракулов (Chainlink / custom nodes).',
  },
  {
    q: 'В какой блокчейн-сети развёрнут смарт-контракт?',
    a: 'Протокол интегрирован с сетью Solana Devnet для обеспечения сверхбыстрого подтверждения (400 мс) и минимальных комиссий (доли цента). Все финансовые действия и хэши чеков фиксируются в SPL Memo программе.',
    todo: 'зафиксировать аудит смарт-контрактов перед развертыванием в Solana Mainnet-Beta.',
  },
];

export function FaqAccordion() {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set([0]));

  const toggle = (idx: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <section id="faq" className="relative z-10 py-24 sm:py-28 bg-[#080b11] border-t border-white/[0.06] font-sans">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="mb-14 max-w-2xl">
          <p className="text-[12px] font-mono uppercase tracking-widest text-emerald-400 mb-3">
            Вопросы и ответы
          </p>
          <h2 className="font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-light leading-[1.12] text-white mb-4 tracking-tight">
            Часто задаваемые вопросы
          </h2>
          <p className="font-sans text-[16px] text-slate-300 leading-[1.6]">
            Ответы на ключевые вопросы о механике смарт-контрактов, оракуле и прозрачности.
          </p>
        </div>

        <div className="max-w-4xl space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndices.has(idx);
            return (
              <div
                key={faq.q}
                className={`rounded-xl border bg-[#121827] transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'border-white/[0.18] shadow-lg shadow-black/40'
                    : 'border-white/[0.08] hover:border-white/[0.14]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between p-5 sm:p-6 text-left transition-colors hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <span className="font-sans font-medium text-[16px] sm:text-[17px] text-white pr-4">
                    {faq.q}
                  </span>
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.12] text-slate-400 transition-all duration-300 ${
                      isOpen ? 'rotate-180 border-emerald-500/60 bg-emerald-500/10 text-emerald-400' : ''
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.5 5L7 9.5L11.5 5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="faq-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: 'auto',
                        opacity: 1,
                        transition: {
                          height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.24, delay: 0.06, ease: 'easeOut' },
                        },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.16, ease: 'easeIn' },
                        },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-[14px] sm:text-[15px] text-slate-300 leading-[1.65] font-sans border-t border-white/[0.06] mt-1 pt-4">
                        <p>{faq.a}</p>
                        <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1 w-fit">
                          <span className="font-semibold text-emerald-400 uppercase tracking-wider">
                            TODO
                          </span>
                          <span>{faq.todo}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
