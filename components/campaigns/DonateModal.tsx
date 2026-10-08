'use client';

import React, { useState } from 'react';
import { Campaign, Donation } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { X, Heart, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../lib/AppContext';

interface DonateModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onDonated?: (donation: Donation) => void;
}

const PRESET_AMOUNTS = [25, 50, 100, 250, 500];

export default function DonateModal({ campaign, isOpen, onClose, onDonated }: DonateModalProps) {
  const { t } = useApp();
  const [amount, setAmount] = useState<number>(50);
  const [donorName, setDonorName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedDonation, setCompletedDonation] = useState<Donation | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsSubmitting(true);
    try {
      const don = await api.donate(campaign.id, amount, donorName.trim() || 'Anonymous Donor');
      setCompletedDonation(don);
      if (onDonated) onDonated(don);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setCompletedDonation(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative my-8 transition-colors">
        {/* Close button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {!completedDonation ? (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                {t('donateEscrowTag')}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
              {t('donateTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 line-clamp-1 break-words">
              {campaign.title}
            </p>

            {/* Escrow guarantee banner */}
            <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-3.5 mb-5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                <p className="font-bold text-slate-900 dark:text-white mb-0.5">
                  {t('donateGuaranteeTitle')}
                </p>
                {t('donateGuaranteeDesc')}
              </div>
            </div>

            {/* Presets */}
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t('donateSelectAmount')} ({campaign.currency})
            </label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`py-2 text-xs font-black rounded-xl border transition-all ${
                    amount === amt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative mb-4">
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-16 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder={t('donateCustomPlaceholder')}
                required
              />
              <span className="absolute left-3 top-3 text-slate-400 font-bold text-sm">$</span>
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                {campaign.currency}
              </span>
            </div>

            {/* Impact estimation */}
            <div className="text-xs text-slate-600 dark:text-slate-300 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-2.5 mb-4 flex items-center justify-between gap-2">
              <span className="truncate">{t('donateImpactWillProvide')}</span>
              <span className="font-black text-emerald-800 dark:text-emerald-300 shrink-0">
                ~{Math.max(1, Math.round(amount / 15))} {t('donateImpactFamilies')}
              </span>
            </div>

            {/* Donor name (optional) */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t('donateDonorNameLabel')}
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder={t('donateDonorNamePlaceholder')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>{t('donateSubmitting')}</>
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-white" />
                  {t('donateSubmitBtn')} ({formatCurrency(amount, campaign.currency)})
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-3 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> {t('donateTestnetNotice')}
            </p>
          </form>
        ) : (
          /* Success Proof-of-Aid certificate */
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {t('donateCertBadge')}
            </span>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2 mb-1">
              {t('donateCertTitle')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              {t('donateCertDesc1')}{' '}
              <strong className="text-slate-900 dark:text-white">
                {formatCurrency(completedDonation.amount, completedDonation.currency)}
              </strong>{' '}
              {t('donateCertDesc2')}
            </p>

            {/* Certificate box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left text-xs space-y-2 mb-5 font-mono">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500 dark:text-slate-400">{t('donateCertDonor')}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                  {completedDonation.donorName}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500 dark:text-slate-400">{t('donateCertSupport')}</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  ~{completedDonation.beneficiariesSupported} {t('donateImpactFamilies')}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 dark:text-slate-400">{t('donateCertTx')}</span>
                <span className="text-blue-600 dark:text-blue-400 truncate max-w-[200px]" title={completedDonation.txHash}>
                  {completedDonation.txHash.slice(0, 16)}...
                </span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              {t('donateCertClose')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
