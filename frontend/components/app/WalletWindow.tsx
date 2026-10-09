"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Wallet,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  ArrowUpRight,
  Droplets,
  LogOut,
  X,
  TrendingUp,
} from "lucide-react";

interface WalletWindowProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string | null;
  formattedAddress: string | null;
  balanceSol: number | null;
  isRefreshing: boolean;
  refreshSuccess: boolean;
  refreshBalance: () => void;
  disconnect: () => void;
  roleName?: string;
  className?: string;
  style?: React.CSSProperties;
  containerRef?: React.Ref<HTMLDivElement>;
}

export function WalletWindow({
  isOpen,
  onClose,
  walletAddress,
  formattedAddress,
  balanceSol,
  isRefreshing,
  refreshSuccess,
  refreshBalance,
  disconnect,
  roleName = "AidChain Donor",
  className,
  style,
  containerRef,
}: WalletWindowProps) {
  const { language, t } = useLanguage();
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentSol = balanceSol !== null ? balanceSol : 14.85;
  const solUsdRate = 150.25;
  const currentUsd = currentSol * solUsdRate;

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        style={style}
        className={
          className ||
          "absolute right-0 mt-2.5 w-[350px] sm:w-[390px] rounded-[28px] p-5 bg-white/95 dark:bg-[#070b16]/95 backdrop-blur-3xl border border-slate-200/90 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_25px_rgba(6,182,212,0.08)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.65),0_10px_30px_rgba(6,182,212,0.1)] text-slate-900 dark:text-white font-sans select-none z-50 overflow-hidden"
        }
      >
        {/* Неоновый градиентный фон (Refraction Blur) */}
        <div className="absolute -top-24 -left-20 w-48 h-48 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-20 w-48 h-48 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[60px] pointer-events-none" />

        {/* 1. Верхний бар окна кошелька: Сеть + AidChain Web3 badge + Кнопка закрытия */}
        <div className="relative z-10 flex items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300">
              Solana Network
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-[10px] font-semibold tracking-wide">
            <span className="text-cyan-500 dark:text-cyan-400">◆</span>
            <span>AidChain Web3</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full h-7 w-7 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2. Виртуальная Web3 карта (AidChain Passport) */}
        <div className="relative z-10 mt-3.5 rounded-2xl p-4 bg-gradient-to-br from-[#0c1836] via-[#10224d] to-[#09132b] text-white border border-cyan-500/25 shadow-[0_10px_30px_rgba(6,182,212,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden">
          {/* Декоративные световые блики */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between">
            {/* Золотистый EMV Microchip SVG Icon из референса */}
            <div className="h-7 w-9 rounded-md bg-gradient-to-br from-amber-200/90 via-amber-400/80 to-amber-600/90 border border-amber-300/40 p-1 flex flex-col justify-between shadow-xs">
              <div className="h-0.5 w-full bg-amber-800/40 rounded-full" />
              <div className="h-0.5 w-full bg-amber-800/40 rounded-full" />
              <div className="h-0.5 w-full bg-amber-800/40 rounded-full" />
            </div>

            {/* Заголовок карты */}
            <div className="flex items-center gap-1.5 text-cyan-300/90">
              <span className="text-[10px] font-mono tracking-wider font-semibold uppercase">AIDCHAIN PASSPORT</span>
            </div>
          </div>

          {/* Номер / Хэш кошелька */}
          <div className="mt-3.5 flex items-center justify-between">
            <span className="font-mono text-sm tracking-wider text-slate-200 font-semibold">
              •••• •••• •••• {formattedAddress ? formattedAddress.slice(-4) : "Vz4S"}
            </span>
            <button
              type="button"
              onClick={copyAddress}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition"
              title={language === "ru" ? "Скопировать полный адрес" : "Copy full address"}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Владелец карты */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">{t("walletCardholder")}</span>
              <span className="text-white font-medium truncate block max-w-[170px]">{roleName}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">{t("walletStatus")}</span>
              <span className="text-emerald-400 font-medium">{t("walletVerified")}</span>
            </div>
          </div>
        </div>

        {/* 3. TOTAL BALANCE Секция с неоновым графиком-волной */}
        <div className="relative z-10 mt-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>{t("walletTotalBalance")}</span>
            <button
              type="button"
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              className="p-1 hover:text-slate-900 dark:hover:text-white transition"
              title={isBalanceHidden ? (language === "ru" ? "Показать баланс" : "Show balance") : (language === "ru" ? "Скрыть баланс" : "Hide balance")}
            >
              {isBalanceHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Основная сумма */}
          <div className="mt-1 flex items-baseline justify-center gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white">
              {isBalanceHidden ? "••••••" : `${currentSol.toFixed(3)} SOL`}
            </span>
          </div>

          {/* Эквивалент в USD и пилюля прироста */}
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {isBalanceHidden ? "••••" : `≈ $${currentUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <TrendingUp className="h-3 w-3" />
              +$394.79 (+12.4%)
            </span>
          </div>

          {/* Неоновая светящаяся волна-график (как в референсе) */}
          <div className="relative h-11 w-full mt-1 overflow-hidden pointer-events-none">
            <svg
              className="w-full h-full"
              viewBox="0 0 360 50"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="waveNeonGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="waveFillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path
                d="M0,35 Q40,10 90,28 T180,20 T270,32 T360,12 L360,50 L0,50 Z"
                fill="url(#waveFillGradient)"
              />
              <path
                d="M0,35 Q40,10 90,28 T180,20 T270,32 T360,12"
                stroke="url(#waveNeonGradient)"
                strokeWidth="2.5"
                filter="url(#neonGlow)"
              />
            </svg>
          </div>
        </div>

        {/* 4. Быстрые действия (Панель операций, адаптированная для светлой и темной темы) */}
        <div className="relative z-10 mt-3 pt-3.5 border-t border-slate-200/80 dark:border-white/[0.08] grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={copyAddress}
            className="flex items-center gap-2 rounded-xl p-2 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200/70 dark:border-white/5 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span className="truncate">{copied ? t("walletCopied") : t("walletCopyAddress")}</span>
          </button>

          <button
            type="button"
            onClick={refreshBalance}
            disabled={isRefreshing}
            className="flex items-center justify-between rounded-xl p-2 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200/70 dark:border-white/5 transition disabled:opacity-50"
          >
            <div className="flex items-center gap-2 min-w-0">
              <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isRefreshing ? "animate-spin text-cyan-500" : "text-slate-400"}`} />
              <span className="truncate">{isRefreshing ? t("walletRefreshing") : t("walletRefresh")}</span>
            </div>
            {refreshSuccess && <span className="text-[9px] font-mono text-emerald-500 font-bold">OK</span>}
          </button>

          <a
            href="https://faucet.solana.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl p-2 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 transition"
          >
            <Droplets className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t("walletFaucet")}</span>
          </a>

          <a
            href={`https://explorer.solana.com/address/${walletAddress || ""}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl p-2 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200/70 dark:border-white/5 transition"
          >
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{t("walletExplorer")}</span>
          </a>
        </div>

        {/* 5. Кнопка отключения кошелька */}
        <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              disconnect();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold transition active:scale-[0.98]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{t("walletDisconnect")}</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
