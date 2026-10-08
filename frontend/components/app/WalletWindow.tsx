"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ShieldCheck,
  CreditCard,
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
}: WalletWindowProps) {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [activeTab, setActiveTab] = useState<"crypto" | "escrow" | "tranches">("crypto");
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
        initial={{ opacity: 0, y: -10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="absolute right-0 mt-2.5 w-[360px] sm:w-[410px] rounded-[30px] p-5 bg-[#090f1f]/95 dark:bg-[#060a17]/95 backdrop-blur-3xl border border-cyan-500/20 dark:border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.65),0_10px_30px_rgba(6,182,212,0.1),inset_0_1px_1.5px_rgba(255,255,255,0.18)] text-white font-sans select-none z-50 overflow-hidden"
      >
        {/* Неоновый градиентный фон (Refraction Blur) */}
        <div className="absolute -top-24 -left-20 w-48 h-48 rounded-full bg-cyan-500/15 blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-20 w-48 h-48 rounded-full bg-blue-600/15 blur-[60px] pointer-events-none" />

        {/* 1. Верхний бар окна кошелька: Сеть + Missions badge + Кнопка закрытия */}
        <div className="relative z-10 flex items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-300">
              Solana Network
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[10px] font-semibold tracking-wide">
            <span className="text-cyan-400">◆</span>
            <span>AidChain Web3</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full h-7 w-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2. Виртуальная Web3 карта (из референса в правом верхнем углу) */}
        <div className="relative z-10 mt-3.5 rounded-2xl p-4 bg-gradient-to-br from-[#0c1836] via-[#10224d] to-[#09132b] border border-cyan-500/25 shadow-[0_10px_30px_rgba(6,182,212,0.12),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden">
          {/* Декоративные световые блики */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between">
            {/* EMV Microchip SVG Icon из референса */}
            <div className="h-7 w-9 rounded-md bg-gradient-to-br from-amber-200/90 via-amber-400/80 to-amber-600/90 border border-amber-300/40 p-1 flex flex-col justify-between shadow-xs">
              <div className="h-0.5 w-full bg-amber-800/40 rounded-full" />
              <div className="h-0.5 w-full bg-amber-800/40 rounded-full" />
              <div className="h-0.5 w-full bg-amber-800/40 rounded-full" />
            </div>

            {/* Бесконтактные волны NFC + AidChain */}
            <div className="flex items-center gap-1.5 text-cyan-300/80">
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
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
              title="Скопировать полный адрес"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Владелец карты */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">Владелец</span>
              <span className="text-white font-medium truncate block max-w-[170px]">{roleName}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">Статус</span>
              <span className="text-emerald-400 font-medium">Verified ✓</span>
            </div>
          </div>
        </div>

        {/* 3. TOTAL BALANCE Секция с неоновым графиком-волной (Центр референса) */}
        <div className="relative z-10 mt-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span>TOTAL BALANCE</span>
            <button
              type="button"
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              className="p-1 hover:text-white transition"
              title={isBalanceHidden ? "Показать баланс" : "Скрыть баланс"}
            >
              {isBalanceHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Основная сумма */}
          <div className="mt-1 flex items-baseline justify-center gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white">
              {isBalanceHidden ? "••••••" : `${currentSol.toFixed(3)} SOL`}
            </span>
          </div>

          {/* Эквивалент в USD и пилюля прироста */}
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              {isBalanceHidden ? "••••" : `≈ $${currentUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)]">
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
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
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

        {/* 4. Сегментированные вкладки из референса: [Crypto] [Staking] [NFT] */}
        <div className="relative z-10 mt-2 flex items-center justify-between p-1 rounded-xl bg-white/[0.05] border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab("crypto")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "crypto"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_2px_8px_rgba(6,182,212,0.2)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Крипто (SOL)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("escrow")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "escrow"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_2px_8px_rgba(6,182,212,0.2)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Эскроу
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tranches")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "tranches"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_2px_8px_rgba(6,182,212,0.2)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Транши
          </button>
        </div>

        {/* 5. Карточки активов (Список как в референсе справа) */}
        <div className="relative z-10 mt-3 space-y-2">
          {/* Ассет 1: Solana */}
          <div className="group rounded-2xl p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#9945FF] to-[#14F195] p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                <div className="h-full w-full rounded-[10px] bg-[#0c1220] flex items-center justify-center">
                  <span className="font-extrabold text-xs text-cyan-400 font-mono">◎</span>
                </div>
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-white block">Solana</span>
                <span className="text-[10px] text-slate-400 font-mono">SOL</span>
              </div>
            </div>

            {/* Мини спарклайн-график в строке */}
            <div className="h-5 w-16 hidden sm:block">
              <svg viewBox="0 0 70 20" className="w-full h-full" fill="none">
                <path d="M0,15 Q20,3 40,12 T70,5" stroke="#10b981" strokeWidth="1.8" />
              </svg>
            </div>

            <div className="text-right shrink-0">
              <span className="font-mono text-xs font-bold text-white block">
                {isBalanceHidden ? "••••" : `${currentSol.toFixed(2)} SOL`}
              </span>
              <span className="font-mono text-[10px] text-emerald-400 block">+4.12%</span>
            </div>
          </div>

          {/* Ассет 2: USD Coin */}
          <div className="group rounded-2xl p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                $
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-white block">USD Coin</span>
                <span className="text-[10px] text-slate-400 font-mono">USDC</span>
              </div>
            </div>

            <div className="h-5 w-16 hidden sm:block">
              <svg viewBox="0 0 70 20" className="w-full h-full" fill="none">
                <path d="M0,10 Q25,8 45,11 T70,9" stroke="#38bdf8" strokeWidth="1.8" />
              </svg>
            </div>

            <div className="text-right shrink-0">
              <span className="font-mono text-xs font-bold text-white block">
                {isBalanceHidden ? "••••" : "1,500.00 USDC"}
              </span>
              <span className="font-mono text-[10px] text-slate-400 block">≈ $1,500.00</span>
            </div>
          </div>

          {/* Ассет 3: Эскроу смарт-контракт */}
          <div className="group rounded-2xl p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-white block">Эскроу транши</span>
                <span className="text-[10px] text-emerald-400 font-mono">SMART CONTRACT</span>
              </div>
            </div>

            <div className="h-5 w-16 hidden sm:block">
              <svg viewBox="0 0 70 20" className="w-full h-full" fill="none">
                <path d="M0,18 Q20,12 40,8 T70,2" stroke="#06b6d4" strokeWidth="1.8" />
              </svg>
            </div>

            <div className="text-right shrink-0">
              <span className="font-mono text-xs font-bold text-white block">
                {isBalanceHidden ? "••••" : "9.00 SOL"}
              </span>
              <span className="text-[10px] font-mono text-cyan-300 block">Заблокировано</span>
            </div>
          </div>
        </div>

        {/* 6. Быстрые действия (Панель операций) */}
        <div className="relative z-10 mt-3.5 pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={copyAddress}
            className="flex items-center gap-2 rounded-xl p-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span className="truncate">{copied ? "Скопировано!" : "Копировать адрес"}</span>
          </button>

          <button
            type="button"
            onClick={refreshBalance}
            disabled={isRefreshing}
            className="flex items-center justify-between rounded-xl p-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <div className="flex items-center gap-2 min-w-0">
              <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isRefreshing ? "animate-spin text-cyan-400" : "text-slate-400"}`} />
              <span className="truncate">{isRefreshing ? "Обновление..." : "Обновить баланс"}</span>
            </div>
            {refreshSuccess && <span className="text-[9px] font-mono text-emerald-400">OK</span>}
          </button>

          <a
            href="https://faucet.solana.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl p-2 bg-white/[0.04] hover:bg-emerald-500/15 text-emerald-400 transition"
          >
            <Droplets className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Тестовый кран (Faucet)</span>
          </a>

          <a
            href={`https://explorer.solana.com/address/${walletAddress || ""}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl p-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition"
          >
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">Solana Explorer</span>
          </a>
        </div>

        {/* 7. Кнопка отключения кошелька */}
        <div className="relative z-10 mt-3 pt-2.5 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              disconnect();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-xs font-semibold transition active:scale-[0.98]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Отключить кошелёк Phantom</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
