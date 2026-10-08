'use client';

import React from 'react';
import { X, ShieldCheck, ExternalLink, Hash } from 'lucide-react';
import { useApp } from '../../lib/AppContext';

interface BlockchainVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractAddress: string;
  txHash?: string;
  proofHash?: string;
  title: string;
}

export default function BlockchainVerifyModal({
  isOpen,
  onClose,
  contractAddress,
  txHash,
  proofHash,
  title,
}: BlockchainVerifyModalProps) {
  const { t } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative p-6 my-8 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
            {t('verifyTitle')}
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 line-clamp-1 break-words">{title}</p>

        <div className="space-y-3.5 text-xs">
          {/* Smart Contract */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">{t('verifyContractLabel')}</span>
              <a
                href={`https://amoy.polygonscan.com/address/${contractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                {t('verifyPolygonscan')} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="font-mono text-slate-800 dark:text-slate-200 break-all text-[11px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700 select-all">
              {contractAddress}
            </p>
          </div>

          {/* Proof Hash */}
          {proofHash && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1 truncate">
                  <Hash className="w-3.5 h-3.5 shrink-0" /> {t('verifyShaLabel')}
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold text-[10px] bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full shrink-0">
                  {t('verifyImmutableBadge')}
                </span>
              </div>
              <p className="font-mono text-emerald-950 dark:text-emerald-200 break-all text-[11px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-200/80 dark:border-emerald-800 select-all">
                {proofHash}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 break-words">
                {t('verifyShaNote')}
              </p>
            </div>
          )}

          {/* Tx Hash */}
          {txHash && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">{t('verifyTxLabel')}</span>
                <a
                  href={`https://amoy.polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  {t('verifyExplorer')} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="font-mono text-slate-800 dark:text-slate-200 break-all text-[11px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700 select-all">
                {txHash}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs transition-colors"
          >
            {t('verifyCloseBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
