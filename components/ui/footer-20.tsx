'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { NewTwitterIcon, TelegramIcon, GithubIcon } from '@hugeicons/core-free-icons';
import { motion, type Variants } from 'framer-motion';
import { useLanguage } from '@/components/providers/LanguageProvider';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const riseItem: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.6, bounce: 0 },
  },
};

const giantTextVariant: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.9, bounce: 0 },
  },
};

type LinkItem = { label: string; href: string };

export interface Footer20Props {
  brandName?: string;
  description?: string;
  columns?: { title: string; links: LinkItem[] }[];
  socials?: { label: string; href: string; icon: React.ReactNode }[];
}

/**
 * Clean transparent PNG logo without black background
 */
function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/aidchain-logo.png"
        alt="AidChain"
        draggable={false}
        className="w-full h-auto select-none drop-shadow-[0_4px_24px_rgba(77,139,255,0.4)]"
      />
    </div>
  );
}

export default function Footer20({
  brandName = 'AidChain',
  socials = [
    { label: 'Telegram', href: '#', icon: <HugeiconsIcon icon={TelegramIcon} size={18} /> },
    { label: 'X', href: '#', icon: <HugeiconsIcon icon={NewTwitterIcon} size={18} /> },
    { label: 'GitHub', href: 'https://github.com', icon: <HugeiconsIcon icon={GithubIcon} size={18} /> },
  ],
}: Footer20Props) {
  const { language } = useLanguage();

  const description =
    language === 'ru'
      ? 'Протокол целевой гуманитарной помощи. Деньги лежат в смарт-контракте и выходят только по проверенному чеку.'
      : 'Milestone-based humanitarian aid protocol. Funds remain in smart contract escrow and release only upon verified receipts.';

  const columns = [
    {
      title: language === 'ru' ? 'Путь перевода' : 'Aid Flow',
      links: [
        { label: language === 'ru' ? 'Донор' : 'Donor', href: '#stage-donor' },
        { label: language === 'ru' ? 'Эскроу' : 'Escrow', href: '#stage-escrow' },
        { label: language === 'ru' ? 'AI-оракул' : 'AI Oracle', href: '#stage-oracle' },
        { label: language === 'ru' ? 'Доставка' : 'Logistics', href: '#stage-logistics' },
      ],
    },
    {
      title: language === 'ru' ? 'Протокол' : 'Protocol',
      links: [
        { label: language === 'ru' ? 'Симуляция' : 'Simulation', href: '#simulation' },
        { label: language === 'ru' ? 'Безопасность' : 'Security', href: '#security' },
        { label: language === 'ru' ? 'Частые вопросы' : 'FAQ', href: '#faq' },
        { label: 'Solana Explorer', href: 'https://explorer.solana.com/?cluster=devnet' },
      ],
    },
  ];

  return (
    <motion.footer
      id="footer"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className="relative z-10 w-full overflow-hidden bg-ink text-paper/60 border-t border-paper/10"
    >
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pt-20 sm:px-10 md:pt-24 lg:px-16">
        <div className="mb-16 grid grid-cols-1 gap-14 lg:mb-20 lg:grid-cols-12 lg:gap-8">
          {/* brand */}
          <motion.div variants={riseItem} className="flex flex-col gap-6 lg:col-span-5">
            <BrandLogo className="w-[140px] sm:w-[160px]" />
            <p className="max-w-[340px] text-[15px] leading-[1.65] text-paper/70 font-sans">
              {description}
            </p>
            <div className="flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-paper/10 text-paper/60 transition-colors hover:border-emerald-500/60 hover:text-paper"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </motion.div>

          {/* link columns */}
          <div className="grid grid-cols-2 gap-10 lg:col-span-7 lg:grid-cols-3 lg:gap-8">
            {columns.map((col) => (
              <motion.div key={col.title} variants={riseItem} className="flex flex-col gap-5">
                <h4 className="text-[14px] font-medium text-paper font-sans">{col.title}</h4>
                <ul className="flex flex-col gap-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-[14px] text-paper/60 transition-colors hover:text-paper font-sans"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            <motion.div variants={riseItem} className="col-span-2 flex flex-col gap-5 lg:col-span-1">
              <h4 className="text-[14px] font-medium text-paper font-sans">
                {language === 'ru' ? 'Статус протокола' : 'Protocol Status'}
              </h4>
              <div className="flex items-center gap-2.5 text-[14px] text-emerald-400 font-sans font-mono text-[13px]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Solana Network (1.18)
              </div>
              <p className="text-[12px] text-paper/40 leading-relaxed font-sans">
                {language === 'ru'
                  ? 'Смарт-контракты эскроу и SPL Memo оракула развернуты в сети Solana.'
                  : 'Escrow smart contracts and SPL Memo oracle logic deployed on Solana.'}
              </p>
            </motion.div>
          </div>
        </div>

        {/* bottom bar */}
        <motion.div
          variants={riseItem}
          className="flex flex-col gap-2 border-t border-dashed border-paper/10 py-6 text-[13px] text-paper/40 sm:flex-row sm:justify-between"
        >
          <span>© 2026 {brandName}</span>
          <span>
            {language === 'ru'
              ? 'Демонстрация: суммы и хэши в симуляции условные.'
              : 'Demonstration: simulation amounts and hashes are illustrative.'}
          </span>
        </motion.div>

        {/* giant wordmark — perfectly scaled SVG vector text that NEVER clips on any screen size */}
        <motion.div
          variants={giantTextVariant}
          aria-hidden
          className="pointer-events-none -mb-2 mt-4 select-none w-full flex items-center justify-center overflow-visible"
        >
          <svg
            viewBox="0 0 1000 170"
            className="w-full h-auto max-h-[190px] select-none pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <text
              x="500"
              y="135"
              textAnchor="middle"
              fill="rgba(241, 245, 249, 0.07)"
              className="font-display font-medium"
              style={{ fontSize: '150px', letterSpacing: '-0.04em' }}
            >
              {brandName}
            </text>
          </svg>
        </motion.div>
      </div>
    </motion.footer>
  );
}
