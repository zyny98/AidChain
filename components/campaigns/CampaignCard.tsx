'use client';

import React from 'react';
import Link from 'next/link';
import { Campaign } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { Users, ShieldCheck, ArrowRight, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../lib/AppContext';

interface CampaignCardProps {
  campaign: Campaign;
  onDonateClick?: (campaign: Campaign) => void;
}

export default function CampaignCard({ campaign, onDonateClick }: CampaignCardProps) {
  const { t } = useApp();
  const percentCollected = Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100));
  const percentReleased = Math.min(100, Math.round((campaign.releasedAmount / campaign.targetAmount) * 100));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group min-w-0">
      {/* Cover image & badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={campaign.coverImage}
          alt={campaign.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

        {/* Emergency level & category */}
        <div className="absolute top-3 left-3 flex gap-2 max-w-[90%] flex-wrap">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-600/90 text-white backdrop-blur-md shadow-sm shrink-0">
            {campaign.impact.emergencyLevel}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-md truncate max-w-[150px]">
            {campaign.category}
          </span>
        </div>

        {/* Region */}
        <div className="absolute bottom-3 left-3 text-white text-xs font-medium flex items-center gap-1.5 drop-shadow truncate max-w-[90%]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="truncate">{campaign.impact.region}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col min-w-0">
        {/* Organizer */}
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
            {campaign.organizer.name}
          </span>
          {campaign.organizer.verified && (
            <span title="Верифицированная NGO" className="shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/campaigns/${campaign.id}`} className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2 break-words">
            {campaign.title}
          </h3>
        </Link>

        {/* Short description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed break-words">
          {campaign.shortDescription}
        </p>

        {/* Beneficiaries highlight */}
        <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-3 mb-4 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
              {t('missionBeneficiaries')}
            </span>
          </div>
          <span className="text-xs font-black text-blue-900 dark:text-blue-200 shrink-0">
            {formatNumber(campaign.impact.beneficiariesReached)} / {formatNumber(campaign.impact.beneficiariesTarget)}
          </span>
        </div>

        {/* Funding progress */}
        <div className="space-y-1.5 mb-5 mt-auto">
          <div className="flex justify-between items-baseline text-xs gap-1">
            <span className="font-black text-slate-900 dark:text-white text-sm truncate">
              {formatCurrency(campaign.collectedAmount, campaign.currency)}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium truncate text-right">
              {t('missionGoal')} {formatCurrency(campaign.targetAmount, campaign.currency)}
            </span>
          </div>

          {/* Progress bar with release marker */}
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${percentCollected}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 gap-1">
            <span className="truncate">{percentCollected}% {t('missionRaisedInEscrow')}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              {percentReleased}% {t('missionConfirmedByAi')}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Link
            href={`/campaigns/${campaign.id}`}
            className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
          >
            {t('missionDetails')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => onDonateClick && onDonateClick(campaign)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
          >
            <HeartHandshake className="w-3.5 h-3.5" /> {t('missionHelp')}
          </button>
        </div>
      </div>
    </div>
  );
}
