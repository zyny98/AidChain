'use client';

import React, { useState } from 'react';
import {
  Upload,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  FileCheck2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { shortenHash } from '../../lib/utils';
import { useApp } from '../../lib/AppContext';

export default function AIProofUploader() {
  const { t } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);

  const handleLoadSample = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 600);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('INVOICE / ФИСКАЛЬНЫЙ ЧЕК', 20, 40);
      ctx.font = '12px monospace';
      ctx.fillText('Поставщик: Al-Baraka Food Supplies', 20, 70);
      ctx.fillText('БИН/ИИН: 180540023419', 20, 95);
      ctx.fillText('Дата: 2026-10-06', 20, 120);
      ctx.fillText('-----------------------------------', 20, 140);
      ctx.fillText('1. Продуктовые пайки x 1,000 : $10,000', 20, 170);
      ctx.fillText('2. Логистика и доставка     : $2,500', 20, 195);
      ctx.fillText('-----------------------------------', 20, 220);
      ctx.font = 'bold 14px monospace';
      ctx.fillText('ИТОГО: $12,500 USDC', 20, 250);
      ctx.font = '10px monospace';
      ctx.fillText('ФИСКАЛЬНЫЙ ПРИЗНАК: 9481920149', 20, 290);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const sampleFile = new File([blob], 'fiscal_receipt_sample.png', { type: 'image/png' });
        setFile(sampleFile);
        triggerValidation(sampleFile);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      triggerValidation(selected);
    }
  };

  const triggerValidation = async (targetFile: File) => {
    setIsProcessing(true);
    setResult(null);
    try {
      const res = await api.validateReceipt('m-001', targetFile, 'Оптовая закупка гуманитарной помощи', 12500);
      setResult(res);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-sm transition-colors overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              {t('aiCardTitle')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl break-words">
            {t('aiCardDesc')}
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          disabled={isProcessing}
          className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
        >
          <FileText className="w-4 h-4" /> {t('aiSampleBtn')}
        </button>
      </div>

      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="min-w-0">
          <label className="block w-full cursor-pointer">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-6 sm:p-8 text-center transition-all bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 transition-colors">
                <Upload className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 break-words">
                {file ? file.name : t('aiDropTitle')}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 break-words">
                {t('aiDropSub')}
              </p>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </div>
          </label>

          {isProcessing && (
            <div className="mt-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0"></div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-blue-900 dark:text-blue-200 truncate">{t('aiProcessingTitle')}</p>
                <p className="text-blue-700 dark:text-blue-400 truncate">{t('aiProcessingSub')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Validation Output */}
        <div className="min-w-0">
          {result ? (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-4 overflow-hidden">
              {/* Verdict header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {result.verdict === 'approved' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> {t('aiApproved')}
                    </div>
                  ) : result.verdict === 'needs_review' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> {t('aiReview')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-black">
                      <XCircle className="w-4 h-4 shrink-0" /> {t('aiRejected')}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('aiConfidence')}</span>
                  <span className="ml-1 text-sm font-black text-slate-900 dark:text-white">{result.confidence_score}%</span>
                </div>
              </div>

              {/* SHA-256 and Oracle Key */}
              <div className="space-y-1.5 text-[11px] font-mono bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                  <span className="text-slate-400 shrink-0">{t('aiSha256')}</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold break-all select-all">
                    {result.sha256_hash}
                  </span>
                </div>
                {result.oracle_signature && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 shrink-0">{t('aiEcdsa')}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold break-all select-all">
                      {shortenHash(result.oracle_signature, 10)}
                    </span>
                  </div>
                )}
              </div>

              {/* Reasons breakdown */}
              <div>
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {t('aiReportHeader')}
                </h5>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {result.reasons.map((r: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5 break-words">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Extracted Vendor details */}
              {result.extracted_data && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs flex flex-wrap justify-between gap-2 text-slate-600 dark:text-slate-400">
                  <span>{t('aiVendor')} <strong className="text-slate-900 dark:text-white">{result.extracted_data.vendor_name || 'Al-Baraka Foods'}</strong></span>
                  <span>{t('aiAmount')} <strong className="text-slate-900 dark:text-white">{result.extracted_data.total_amount ? `$${result.extracted_data.total_amount}` : '$12,500'}</strong></span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[220px] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500">
              <FileCheck2 className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-xs font-semibold">{t('aiPlaceholderTitle')}</p>
              <p className="text-[11px] mt-0.5">{t('aiPlaceholderSub')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
