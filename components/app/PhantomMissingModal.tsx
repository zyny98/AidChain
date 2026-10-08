"use client";

import React from "react";
import { AlertCircle, ExternalLink, X } from "lucide-react";

interface PhantomMissingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PhantomMissingModal({ isOpen, onClose }: PhantomMissingModalProps) {
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
              Кошелёк Phantom не найден
            </h3>
            <p className="text-xs text-slate-400">Solana Devnet Web3</p>
          </div>
        </div>

        {/* ТОЧНОЕ ТРЕБОВАНИЕ ИЗ ТЗ */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-4 mb-4">
          <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed">
            Откройте приложение в отдельной вкладке с установленным Phantom
          </p>
        </div>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Для подтверждения пожертвований, создания сборов и фиксации аудита в блокчейне Solana Devnet необходимо браузерное расширение Phantom.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://phantom.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-950 py-2.5 px-4 text-xs font-bold hover:bg-slate-100 active:scale-[0.98] transition shadow-sm"
          >
            Установить Phantom
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 px-4 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}
