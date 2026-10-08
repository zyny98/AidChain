'use client';

import React from 'react';
import { SupplyChainStepInfo } from '../../types';
import {
  Wallet,
  Building2,
  Store,
  Truck,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { shortenHash } from '../../lib/utils';
import { useApp } from '../../lib/AppContext';

interface SupplyChainTrackerProps {
  steps: SupplyChainStepInfo[];
  onVerifyProof?: (step: SupplyChainStepInfo) => void;
}

const STAGE_ICONS = {
  donor: Wallet,
  ngo: Building2,
  supplier: Store,
  distributor: Truck,
  beneficiary: Users,
};

export default function SupplyChainTracker({ steps, onVerifyProof }: SupplyChainTrackerProps) {
  const { t, language } = useApp();

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'donor':
        return t('stepDonor');
      case 'ngo':
        return t('stepNgo');
      case 'supplier':
        return t('stepSupplier');
      case 'distributor':
        return t('stepDistributor');
      case 'beneficiary':
        return t('stepBeneficiary');
      default:
        return stage;
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm overflow-hidden transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              {t('scTrackerTitle')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {t('scTrackerSub')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-800/60">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            {t('scZkBadge')}
          </span>
        </div>
      </div>

      {/* 5-step desktop stepper / mobile cards */}
      <div className="w-full overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {steps.map((step, idx) => {
            const Icon = STAGE_ICONS[step.stage] || ShieldCheck;
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';

            return (
              <div
                key={step.stage}
                className={`flex flex-col p-4 rounded-2xl border min-w-0 overflow-hidden transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50'
                    : isActive
                    ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 opacity-75'
                }`}
              >
                {/* Stage number & status badge */}
                <div className="flex items-center justify-between gap-1 mb-3">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                    {t('scStep')} {idx + 1}
                  </span>
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full truncate">
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> {t('scConfirmed')}
                    </span>
                  ) : isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full animate-pulse truncate">
                      <Clock className="w-3 h-3 shrink-0" /> {t('scInProgress')}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                      {t('scPending')}
                    </span>
                  )}
                </div>

                {/* Icon & Label */}
                <div className="flex items-center gap-2.5 mb-2 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate">
                      {getStageLabel(step.stage)}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {step.actorRole}
                    </p>
                  </div>
                </div>

                {/* Actor details */}
                <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 mb-2">
                  <p className="line-clamp-2 break-words">{step.actorName}</p>
                </div>

                {/* Notes */}
                {step.notes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700 mb-2 leading-tight break-words">
                    {step.notes}
                  </p>
                )}

                {/* Proof verification links */}
                <div className="mt-auto pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] gap-1">
                  {step.proofHash ? (
                    <button
                      onClick={() => onVerifyProof && onVerifyProof(step)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors truncate"
                      title={step.proofHash}
                    >
                      <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t('scHash')} {shortenHash(step.proofHash, 4)}</span>
                    </button>
                  ) : step.txHash ? (
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono text-[10px] truncate">
                      {t('scTx')} {shortenHash(step.txHash, 4)}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] truncate">
                      {t('scAwaiting')}
                    </span>
                  )}

                  {step.verifiedAt && (
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] shrink-0">
                      {step.verifiedAt}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
