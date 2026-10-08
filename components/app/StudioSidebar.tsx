"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import {
  IconHeartHandshake,
  IconTruckDelivery,
  IconBuildingBank,
  IconShieldCheck,
  IconClock,
  IconChevronDown,
} from "@tabler/icons-react";

interface StudioSidebarProps {
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export function StudioSidebar({ isCollapsed }: StudioSidebarProps) {
  const pathname = usePathname();
  const { hitlQueue, campaigns, auditRecords } = useAppStore();
  const { formattedAddress, isConnected } = usePhantomWallet();

  const pendingHitlCount = hitlQueue.filter((h) => h.status === "pending").length;

  return (
    <div
      className={`flex flex-col h-full select-none border-r border-slate-200/80 dark:border-white/10 bg-[#eef1f5]/90 dark:bg-[#0f1422]/90 backdrop-blur-md transition-all duration-300 ${
        isCollapsed ? "w-0 p-0 overflow-hidden opacity-0 pointer-events-none" : "w-[260px] p-3.5"
      }`}
    >
      {/* 1. Верхний бар сайдбара: 3 кругляшка macOS (Traffic Lights) */}
      <div className="flex items-center justify-between pb-3.5 pt-1 px-1">
        {/* Кнопки macOS Red, Yellow, Green */}
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full bg-[#ff5f57] border border-[#e0443e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_2px_rgba(255,95,87,0.3)] cursor-pointer hover:opacity-85 transition"
            title="Закрыть"
          />
          <span
            className="h-3 w-3 rounded-full bg-[#febc2e] border border-[#d89e24] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_2px_rgba(254,188,46,0.3)] cursor-pointer hover:opacity-85 transition"
            title="Свернуть"
          />
          <span
            className="h-3 w-3 rounded-full bg-[#28c840] border border-[#1aab29] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_2px_rgba(40,200,64,0.3)] cursor-pointer hover:opacity-85 transition"
            title="Развернуть"
          />
        </div>
      </div>

      {/* 2. Профиль пользователя с аватаром */}
      <div className="flex items-center gap-3 px-1.5 py-2 mb-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition cursor-pointer">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e232e] text-white overflow-hidden shadow-sm border border-slate-300 dark:border-white/10">
          {/* Стилизованная иконка аватара с очками */}
          <svg className="h-8 w-8 text-slate-200" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="16" r="8" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="17" cy="16" r="3" stroke="#0f172a" strokeWidth="1.5" fill="#ffffff" />
            <circle cx="23" cy="16" r="3" stroke="#0f172a" strokeWidth="1.5" fill="#ffffff" />
            <line x1="20" y1="16" x2="20" y2="16" stroke="#0f172a" strokeWidth="1.5" />
            <path d="M12 14c2-5 12-6 16-2" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 36c2-8 7-11 12-11s10 3 12 11" fill="#334155" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {isConnected ? "AidChain Donor" : "Nikita Z."}
            </span>
            <IconChevronDown className="h-3 w-3 text-slate-400 shrink-0" stroke={2} />
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate block">
            {isConnected ? formattedAddress : "donor@aidchain.sol"}
          </span>
        </div>
      </div>

      {/* Скроллируемая область навигации */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pr-0.5 text-xs scrollbar-thin">
        {/* Секция: Projects (Строго 4 профиля в едином порядке) */}
        <div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
            Projects
          </span>
          <nav className="space-y-1">
            {/* 1. Донор */}
            <Link
              href="/app/donor"
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                pathname === "/app/donor"
                  ? "bg-gradient-to-b from-white to-white/75 dark:from-white/15 dark:to-white/5 border border-white dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconHeartHandshake
                  className={`h-4 w-4 shrink-0 ${
                    pathname === "/app/donor" ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                  stroke={1.9}
                />
                <span className="truncate">Донор</span>
              </div>
              <span className="rounded-full bg-slate-200/70 dark:bg-white/10 px-2 py-0.2 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-medium">
                0
              </span>
            </Link>

            {/* 2. Перевозчик (Поставщик) */}
            <Link
              href="/app/vendor"
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                pathname === "/app/vendor"
                  ? "bg-gradient-to-b from-white to-white/75 dark:from-white/15 dark:to-white/5 border border-white dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconTruckDelivery
                  className={`h-4 w-4 shrink-0 ${
                    pathname === "/app/vendor" ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                  stroke={1.9}
                />
                <span className="truncate">Перевозчик</span>
              </div>
            </Link>

            {/* 3. Фонд */}
            <Link
              href="/app/foundation"
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                pathname === "/app/foundation"
                  ? "bg-gradient-to-b from-white to-white/75 dark:from-white/15 dark:to-white/5 border border-white dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconBuildingBank
                  className={`h-4 w-4 shrink-0 ${
                    pathname === "/app/foundation" ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                  stroke={1.9}
                />
                <span className="truncate">Фонд</span>
              </div>
              <span className="rounded-full bg-slate-200/50 dark:bg-white/5 px-1.5 py-0.2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {campaigns.length}
              </span>
            </Link>

            {/* 4. Админ */}
            <Link
              href="/app/admin"
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                pathname === "/app/admin"
                  ? "bg-gradient-to-b from-white to-white/75 dark:from-white/15 dark:to-white/5 border border-white dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconShieldCheck
                  className={`h-4 w-4 shrink-0 ${
                    pathname === "/app/admin" ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                  stroke={1.9}
                />
                <span className="truncate">Админ</span>
              </div>
              {pendingHitlCount > 0 && (
                <span className="rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                  {pendingHitlCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Секция: Status (Только пункт History со всеми блокчейн-транзакциями) */}
        <div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
            Status
          </span>
          <div className="space-y-1">
            <Link
              href="/app/history"
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                pathname === "/app/history"
                  ? "bg-gradient-to-b from-white to-white/75 dark:from-white/15 dark:to-white/5 border border-white dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconClock
                  className={`h-4 w-4 shrink-0 ${
                    pathname === "/app/history" ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                  stroke={1.8}
                />
                <span className="truncate">History</span>
              </div>
              <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                {auditRecords.length}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
