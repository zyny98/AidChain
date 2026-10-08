"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { PhantomMissingModal } from "@/components/app/PhantomMissingModal";
import {
  Wallet,
  ArrowUpRight,
  RefreshCw,
  Copy,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Droplets,
} from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();
  const {
    isConnected,
    isConnecting,
    isPhantomInstalled,
    formattedAddress,
    walletAddress,
    balanceSol,
    isRefreshing,
    refreshSuccess,
    connect,
    disconnect,
    refreshBalance,
  } = usePhantomWallet();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleConnectClick = async () => {
    if (!isPhantomInstalled) {
      setShowMissingModal(true);
      return;
    }
    const success = await connect();
    if (!success && !isPhantomInstalled) {
      setShowMissingModal(true);
    }
  };

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPageTitle = () => {
    if (pathname.includes("/foundation")) return "Кабинет Фонда";
    if (pathname.includes("/vendor")) return "Кабинет Поставщика";
    if (pathname.includes("/admin")) return "Панель Администратора";
    return "Кабинет Донора";
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090d16]/95 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Левая часть: Лаконичный заголовок страницы и статус сети */}
          <div className="flex items-center gap-3">
            {pathname !== "/app/donor" && (
              <h2 className="font-display font-medium text-sm sm:text-base text-white tracking-tight">
                {getPageTitle()}
              </h2>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-mono text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Solana Devnet
            </span>
          </div>

          {/* Правая часть: Только кошелёк Phantom без лишнего визуального шума */}
          <div className="flex items-center gap-3">
            {!isConnected ? (
              <button
                onClick={handleConnectClick}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#3b82f6] active:bg-[#1d4ed8] transition-all active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d16]"
              >
                <Wallet className="h-3.5 w-3.5 text-white" />
                <span>
                  {isConnecting ? "Подключение..." : "Подключить Phantom"}
                </span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#121827] px-3 py-1.5 text-xs font-medium text-white hover:border-white/[0.2] transition-all active:scale-[0.98] shadow-sm"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-emerald-400 font-medium text-[11px]">
                    {formattedAddress}
                  </span>
                  <div className="h-3 w-px bg-white/20" />
                  <span className="text-slate-200 font-mono text-[11px]">
                    {balanceSol !== null ? `${balanceSol.toFixed(3)} SOL` : "devnet"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {/* Dropdown меню кошелька */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/[0.1] bg-[#121827] p-2 shadow-2xl z-50">
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                      <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                        Solana Devnet Кошелёк
                      </p>
                      <p className="text-xs font-mono text-emerald-400 truncate mt-0.5 select-all">
                        {walletAddress}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={copyToClipboard}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span>{copied ? "Адрес скопирован!" : "Скопировать адрес"}</span>
                      </button>

                      <button
                        onClick={refreshBalance}
                        disabled={isRefreshing}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition disabled:opacity-60"
                      >
                        <div className="flex items-center gap-2">
                          <RefreshCw
                            className={`h-3.5 w-3.5 transition-transform ${
                              isRefreshing ? "animate-spin text-emerald-400" : "text-slate-400"
                            }`}
                          />
                          <span>
                            {isRefreshing ? "Синхронизация..." : "Обновить баланс SOL"}
                          </span>
                        </div>
                        {refreshSuccess && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Обновлено!
                          </span>
                        )}
                      </button>

                      <a
                        href="https://faucet.solana.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition"
                      >
                        <Droplets className="h-3.5 w-3.5" />
                        <span>Получить SOL (Faucet)</span>
                      </a>

                      <a
                        href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                        <span>Solana Explorer</span>
                      </a>
                    </div>

                    <div className="pt-1 border-t border-white/[0.06]">
                      <button
                        onClick={() => {
                          disconnect();
                          setIsDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Отключить кошелёк</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <PhantomMissingModal
        isOpen={showMissingModal}
        onClose={() => setShowMissingModal(false)}
      />
    </>
  );
}
