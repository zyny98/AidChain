'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../lib/AppContext';

export default function Footer() {
  const { t } = useApp();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                AID<span className="text-blue-600 dark:text-blue-400">CHAIN</span> — {t('brandTagline')}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed break-words">
              {t('footerDesc')}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                {t('footerZkBeneficiary')}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Polygon Amoy Testnet
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              {t('footerTechHeading')}
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>AidChainEscrow.sol (OpenZeppelin)</li>
              <li>GPT-4o-mini Vision OCR</li>
              <li>ECDSA Oracle Signatures</li>
              <li>SHA-256 On-Chain Proofs</li>
              <li>Account Abstraction (ERC-4337)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              {t('footerDocsHeading')}
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t('footerAdminLink')}
                </Link>
              </li>
              <li>
                <a
                  href="https://amoy.polygonscan.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t('footerExplorerLink')}
                </a>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500">{t('footerVersion')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 gap-4 text-center sm:text-left">
          <p>{t('footerCopyright')}</p>
          <p>{t('footerMissionSub')}</p>
        </div>
      </div>
    </footer>
  );
}
