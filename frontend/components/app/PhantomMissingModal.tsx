"use client";

import React from "react";
import { AlertCircle, ExternalLink, X } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PhantomMissingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PhantomMissingModal({ isOpen, onClose }: PhantomMissingModalProps) {
  const { language, t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#121827] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.05] hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              {t("walletMissingTitle")}
            </h3>
            <p className="text-xs text-slate-400">Solana Web3</p>
          </div>
        </div>

        {/* Требование из ТЗ */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-4 mb-4">
          <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed">
            {t("walletMissingDesc")}
          </p>
        </div>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {language === "ru"
            ? "Для подтверждения пожертвований, создания сборов и фиксации аудита в блокчейне Solana необходимо браузерное расширение Phantom."
            : "To sign donations, create campaigns and record audit logs on the Solana blockchain, the Phantom browser extension is required."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://phantom.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white py-2.5 px-4 text-xs font-bold active:scale-[0.98] transition shadow-sm"
          >
            {t("walletMissingInstall")}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 px-4 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition"
          >
            {language === "ru" ? "Понятно" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
