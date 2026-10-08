"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { PhantomMissingModal } from "@/components/app/PhantomMissingModal";
import { WalletWindow } from "@/components/app/WalletWindow";
import {
  Wallet,
  ChevronDown,
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

  const getRoleName = () => {
    if (pathname.includes("/foundation")) return "БФ «Чистое Сердце»";
    if (pathname.includes("/vendor")) return "ТОО «МедСнаб Трейд»";
    if (pathname.includes("/admin")) return "HITL Валидатор";
    if (pathname.includes("/history")) return "Solana Explorer";
    return "AidChain Donor";
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
      subtitle: "Прозрачные пожертвования и контроль целевого расходования",
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

              {/* Новое окно кошелька по референсу пользователя */}
              <WalletWindow
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                walletAddress={walletAddress}
                formattedAddress={formattedAddress}
                balanceSol={balanceSol}
                isRefreshing={isRefreshing}
                refreshSuccess={refreshSuccess}
                refreshBalance={refreshBalance}
                disconnect={disconnect}
                roleName={getRoleName()}
              />
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
