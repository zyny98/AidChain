"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { PhantomMissingModal } from "@/components/app/PhantomMissingModal";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import {
  Wallet,
  ArrowUpRight,
  RefreshCw,
  Copy,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Droplets,
  Menu,
} from "lucide-react";

interface StudioHeaderProps {
  onToggleMobileMenu?: () => void;
}

export function StudioHeader({ onToggleMobileMenu }: StudioHeaderProps) {
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

  const getPageInfo = () => {
    if (pathname.includes("/foundation")) {
      return {
        title: "Кабинет Фонда",
        subtitle: "Управление целевыми сборами, сметами и загрузка фискальных чеков",
      };
    }
    if (pathname.includes("/vendor")) {
      return {
        title: "Кабинет Перевозчика",
        subtitle: "Прямые расчеты из эскроу-контракта без риска задержек",
      };
    }
    if (pathname.includes("/admin")) {
      return {
        title: "Панель Администратора",
        subtitle: "HITL арбитраж спорных чеков и аккредитация поставщиков",
      };
    }
    if (pathname.includes("/history")) {
      return {
        title: "История транзакций",
        subtitle: "Неизменяемый блокчейн-реестр транзакций в сети Solana Network",
      };
    }
    return {
      title: "Кабинет Донора",
      subtitle: "All Your Workflows And Permissions",
    };
  };

  const pageInfo = getPageInfo();

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 pt-1 border-b border-slate-200/70 dark:border-white/10">
        {/* Заголовок и подзаголовок */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-200"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">
                {pageInfo.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Правая часть: Phantom Wallet */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">

          {!isConnected ? (
            <button
              onClick={handleConnectClick}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white dark:shadow-[0_0_16px_rgba(37,99,235,0.3)] px-3.5 py-1.5 text-xs font-semibold shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>{isConnecting ? "Подключение..." : "Подключить Phantom"}</span>
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-300/80 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-slate-400 transition-all active:scale-[0.98] shadow-sm"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  {formattedAddress}
                </span>
                <div className="h-3 w-px bg-slate-200 dark:bg-white/10" />
                <span className="font-mono text-[11px]">
                  {balanceSol !== null ? `${balanceSol.toFixed(3)} SOL` : "0.00 SOL"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Меню кошелька */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121724] p-2 shadow-2xl z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                      Solana Network
                    </p>
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate mt-0.5 select-all font-medium">
                      {walletAddress}
                    </p>
                  </div>

                  <div className="py-1 text-xs">
                    <button
                      onClick={copyToClipboard}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      <span>{copied ? "Адрес скопирован!" : "Скопировать адрес"}</span>
                    </button>

                    <button
                      onClick={refreshBalance}
                      disabled={isRefreshing}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition disabled:opacity-60"
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${
                            isRefreshing ? "animate-spin text-emerald-500" : "text-slate-400"
                          }`}
                        />
                        <span>{isRefreshing ? "Синхронизация..." : "Обновить баланс"}</span>
                      </div>
                      {refreshSuccess && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          OK
                        </span>
                      )}
                    </button>

                    <a
                      href="https://faucet.solana.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition"
                    >
                      <Droplets className="h-3.5 w-3.5" />
                      <span>Получить SOL (Faucet)</span>
                    </a>

                    <a
                      href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                      <span>Solana Explorer</span>
                    </a>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-white/10">
                    <button
                      onClick={() => {
                        disconnect();
                        setIsDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition"
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
      </header>

      <PhantomMissingModal
        isOpen={showMissingModal}
        onClose={() => setShowMissingModal(false)}
      />
    </>
  );
}
