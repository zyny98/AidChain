"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconWorld,
  IconSparkles,
  IconShare,
  IconLayoutSidebar,
  IconBox,
  IconSettings,
} from "@tabler/icons-react";
import { useAppStore } from "@/lib/store/app-store";

interface FloatingDockProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function FloatingDock({ onToggleSidebar, isSidebarOpen }: FloatingDockProps) {
  const pathname = usePathname();
  const { resetToDefaults } = useAppStore();

  const handleSettingsClick = () => {
    if (confirm("Быстрые настройки: сбросить все демо-данные к начальному состоянию?")) {
      resetToDefaults();
    }
  };

  return (
    <aside
      aria-label="Боковая панель быстрого доступа"
      className="hidden lg:flex flex-col gap-3.5 select-none shrink-0 py-4 pl-4 pr-1 z-30"
    >
      {/* Верхний сегмент (Tall Capsule) */}
      <div className="w-[58px] flex flex-col items-center pt-2 pb-3.5 rounded-[28px] bg-[#dbe0e7] dark:bg-[#131824] border border-white/70 dark:border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition-colors duration-200">
        {/* Тёмный инсетный трек с иконками */}
        <div className="w-[44px] bg-[#161a23] rounded-[22px] py-2 px-1 flex flex-col items-center gap-2 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border border-white/5">
          {/* 1. Верхний логотип: 8-лучевая звезда / астериск */}
          <Link
            href="/app/donor"
            className="flex h-7 w-7 items-center justify-center text-slate-300 hover:text-white transition group"
            title="AidChain Dashboard"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:rotate-45"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
            </svg>
          </Link>

          {/* 2. Главная: Home */}
          <Link
            href="/app/donor"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              pathname === "/app/donor"
                ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title="Главный Дашборд"
          >
            <IconHome className="h-4 w-4" stroke={1.9} />
          </Link>

          {/* 3. Сеть: Globe / Solana Explorer */}
          <a
            href="https://explorer.solana.com/?cluster=devnet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            title="Solana Devnet Explorer"
          >
            <IconWorld className="h-4 w-4" stroke={1.8} />
          </a>

          {/* 4. AI Oracle: Sparkles */}
          <Link
            href="/app/admin"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              pathname === "/app/admin"
                ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title="AI Oracle & HITL Арбитраж"
          >
            <IconSparkles className="h-4 w-4" stroke={1.8} />
          </Link>

          {/* 5. Эскроу / Nodes */}
          <Link
            href="/app/foundation"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              pathname === "/app/foundation"
                ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title="Кабинет Фонда: Транши и сметы"
          >
            <IconShare className="h-4 w-4" stroke={1.8} />
          </Link>

          {/* 6. Переключатель сайдбара окна */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              isSidebarOpen === false
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title={isSidebarOpen === false ? "Развернуть меню окна" : "Свернуть меню окна"}
          >
            <IconLayoutSidebar className="h-4 w-4" stroke={1.8} />
          </button>

          {/* 7. Поставщики / 3D Cube */}
          <Link
            href="/app/vendor"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              pathname === "/app/vendor"
                ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title="Кабинет Поставщика: Прямые выплаты"
          >
            <IconBox className="h-4 w-4" stroke={1.8} />
          </Link>
        </div>

        {/* Вертикальный текст: REAGLE 2026 NAV как на картинке */}
        <div
          className="mt-4 text-[9px] font-mono tracking-[0.24em] uppercase text-slate-400/90 dark:text-slate-500 select-none font-semibold"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          REAGLE 2026 NAV
        </div>
      </div>

      {/* Нижний сегмент (Settings Capsule) */}
      <div className="w-[58px] flex flex-col items-center pt-3 pb-2 rounded-[24px] bg-[#dbe0e7] dark:bg-[#131824] border border-white/70 dark:border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition-colors duration-200">
        {/* Вертикальный текст: REAGLE SETTINGS */}
        <div
          className="mb-3 text-[8.5px] font-mono tracking-[0.22em] uppercase text-slate-400/90 dark:text-slate-500 select-none font-semibold"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          REAGLE SETTINGS
        </div>

        {/* Кнопка настроек */}
        <button
          type="button"
          onClick={handleSettingsClick}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[14px] bg-[#161a23] text-slate-300 hover:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-white/5 transition-transform active:scale-95"
          title="Сброс демо и настройки"
        >
          <IconSettings className="h-4 w-4" stroke={1.9} />
        </button>
      </div>
    </aside>
  );
}
