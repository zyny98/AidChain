"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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

  const getRoleProfile = () => {
    if (pathname === "/app/vendor") {
      return {
        name: "ТОО «МедСнаб Трейд»",
        label: isConnected && formattedAddress ? formattedAddress : "Поставщик (B2B)",
      };
    }
    if (pathname === "/app/foundation") {
      return {
        name: "БФ «Чистое Сердце»",
        label: isConnected && formattedAddress ? formattedAddress : "Организатор сборов",
      };
    }
    if (pathname === "/app/admin") {
      return {
        name: "HITL Валидатор",
        label: isConnected && formattedAddress ? formattedAddress : "Администратор Solana",
      };
    }
    if (pathname === "/app/history") {
      return {
        name: "Solana Explorer",
        label: "Блокчейн-реестр",
      };
    }
    return {
      name: isConnected ? "AidChain Donor" : "Nikita Z.",
      label: isConnected && formattedAddress ? formattedAddress : "donor@aidchain.sol",
    };
  };

  const roleProfile = getRoleProfile();

  // Чистые токены для активных/неактивных пунктов в стиле Apple macOS Sequoia
  const getNavClass = (path: string) => {
    const isActive = pathname === path;
    if (isActive) {
      return "group flex items-center justify-between rounded-xl px-2.5 py-1.5 bg-white text-blue-600 dark:bg-white/[0.12] dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_2px_12px_rgba(0,0,0,0.35)] border border-slate-200/90 dark:border-white/15 font-semibold transition-colors duration-150";
    }
    return "group flex items-center justify-between rounded-xl px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border border-transparent transition-colors duration-150";
  };

  const getIconClass = (path: string) => {
    const isActive = pathname === path;
    if (isActive) {
      return "h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400";
    }
    return "h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors";
  };

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? 0 : 260,
        opacity: isCollapsed ? 0 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 32,
        mass: 0.8,
      }}
      aria-label="Внутренняя навигация"
      className="h-full overflow-hidden shrink-0 select-none border-r border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#0c1220]/85 backdrop-blur-3xl shadow-[inset_-1px_0_1px_rgba(255,255,255,0.8),2px_0_16px_rgba(0,0,0,0.02)] dark:shadow-[inset_1px_0_1px_rgba(255,255,255,0.08),10px_0_30px_rgba(0,0,0,0.35)]"
    >
      {/* Жестко фиксированный контейнер 260px предотвращает перенос строк и дергание при анимации ширины */}
      <div className="w-[260px] h-full flex flex-col p-3.5">
        {/* 1. Верхний бар сайдбара: 3 кругляшка macOS (Traffic Lights) */}
        <div className="flex items-center justify-between pb-3 pt-1 px-1">
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
        <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl border border-transparent hover:border-slate-200/60 dark:hover:border-white/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition cursor-pointer">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200/90 dark:bg-[#181f2f] text-slate-700 dark:text-white overflow-hidden shadow-xs border border-slate-300/80 dark:border-white/10">
            <svg className="h-7 w-7 text-slate-700 dark:text-slate-200" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="16" r="8" fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
              <circle cx="17" cy="16" r="3" stroke="#334155" strokeWidth="1.5" fill="#ffffff" />
              <circle cx="23" cy="16" r="3" stroke="#334155" strokeWidth="1.5" fill="#ffffff" />
              <line x1="20" y1="16" x2="20" y2="16" stroke="#334155" strokeWidth="1.5" />
              <path d="M12 14c2-5 12-6 16-2" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 36c2-8 7-11 12-11s10 3 12 11" fill="#64748b" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {roleProfile.name}
              </span>
              <IconChevronDown className="h-3 w-3 text-slate-400 shrink-0" stroke={2} />
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate block">
              {roleProfile.label}
            </span>
          </div>
        </div>

        {/* Скроллируемая область навигации */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pr-0.5 text-xs scrollbar-thin">
          {/* Секция: Кабинеты (Строго 4 профиля в едином порядке) */}
          <div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
              Кабинеты
            </span>
            <nav className="space-y-1">
              {/* 1. Донор */}
              <Link href="/app/donor" className={getNavClass("/app/donor")}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconHeartHandshake className={getIconClass("/app/donor")} stroke={1.9} />
                  <span className="truncate">Донор</span>
                </div>
              </Link>

              {/* 2. Перевозчик (Поставщик) */}
              <Link href="/app/vendor" className={getNavClass("/app/vendor")}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconTruckDelivery className={getIconClass("/app/vendor")} stroke={1.9} />
                  <span className="truncate">Перевозчик</span>
                </div>
              </Link>

              {/* 3. Фонд */}
              <Link href="/app/foundation" className={getNavClass("/app/foundation")}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconBuildingBank className={getIconClass("/app/foundation")} stroke={1.9} />
                  <span className="truncate">Фонд</span>
                </div>
                <span className="rounded-full bg-slate-200/70 dark:bg-white/10 px-1.5 py-0.2 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  {campaigns.length}
                </span>
              </Link>

              {/* 4. Админ */}
              <Link href="/app/admin" className={getNavClass("/app/admin")}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconShieldCheck className={getIconClass("/app/admin")} stroke={1.9} />
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

          {/* Секция: Блокчейн (История транзакций со всеми блокчейн-записями) */}
          <div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
              Блокчейн
            </span>
            <div className="space-y-1">
              <Link href="/app/history" className={getNavClass("/app/history")}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconClock className={getIconClass("/app/history")} stroke={1.8} />
                  <span className="truncate">История транзакций</span>
                </div>
                <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                  {auditRecords.length}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
