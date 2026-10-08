"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconHeartHandshake,
  IconTruckDelivery,
  IconBuildingBank,
  IconShieldCheck,
  IconLayoutSidebar,
  IconSun,
  IconMoon,
} from "@tabler/icons-react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface FloatingDockProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function FloatingDock({ onToggleSidebar, isSidebarOpen }: FloatingDockProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <aside
      aria-label="Боковая панель быстрого доступа"
      className="hidden lg:flex flex-col gap-3.5 select-none shrink-0 py-4 pl-4 pr-1 z-30"
    >
      {/* Верхний сегмент (Tall Capsule) */}
      <div className="w-[58px] flex flex-col items-center pt-2 pb-3.5 rounded-[28px] bg-white/45 dark:bg-black/35 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-colors duration-200">
        {/* Тёмный инсетный трек с иконками */}
        <div className="w-[44px] bg-[#161a23] rounded-[22px] py-2 px-1 flex flex-col items-center gap-2 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border border-white/5">
          {/* 1. Верхний логотип: Наш официальный логотип AidChain */}
          <Link
            href="/app/donor"
            className="flex h-7 w-7 items-center justify-center text-slate-300 hover:text-white transition group rounded-lg overflow-hidden p-0.5"
            title="AidChain Protocol"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/aidchain-icon.png"
              alt="AidChain Logo"
              className="h-5 w-5 object-contain transition-transform group-hover:scale-110"
            />
          </Link>

          {/* 1. Донор */}
          <Link
            href="/app/donor"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              pathname === "/app/donor"
                ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title="1. Кабинет Донора"
          >
            <IconHeartHandshake className="h-4 w-4" stroke={1.9} />
          </Link>

          {/* 2. Перевозчик (Поставщик) */}
          <Link
            href="/app/vendor"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              pathname === "/app/vendor"
                ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title="2. Кабинет Перевозчика / Поставщика"
          >
            <IconTruckDelivery className="h-4 w-4" stroke={1.9} />
          </Link>

          {/* 3. Фонд */}
          <Link
            href="/app/foundation"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              pathname === "/app/foundation"
                ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title="3. Кабинет Благотворительного Фонда"
          >
            <IconBuildingBank className="h-4 w-4" stroke={1.9} />
          </Link>

          {/* 4. Админ */}
          <Link
            href="/app/admin"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              pathname === "/app/admin"
                ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title="4. Панель Администратора & HITL"
          >
            <IconShieldCheck className="h-4 w-4" stroke={1.9} />
          </Link>

          {/* 5. Кнопка скрытия/показа внутреннего сайдбара (последняя после 4 профилей) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              isSidebarOpen === false
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[inset_0_1px_2px_rgba(245,158,11,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title={isSidebarOpen === false ? "Развернуть боковое меню" : "Скрыть боковое меню"}
          >
            <IconLayoutSidebar className="h-4 w-4" stroke={1.8} />
          </button>
        </div>

        {/* Вертикальный текст: AIDCHAIN NAV */}
        <div
          className="mt-4 text-[8.5px] font-mono tracking-[0.24em] uppercase text-slate-400/90 dark:text-slate-500 select-none font-semibold"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          AIDCHAIN NAV
        </div>
      </div>

      {/* Нижний сегмент (Theme Toggle Capsule) */}
      <div className="w-[58px] flex flex-col items-center pt-3 pb-2 rounded-[24px] bg-white/45 dark:bg-black/35 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-colors duration-200">
        {/* Вертикальный текст: СМЕНА ТЕМЫ */}
        <div
          className="mb-3 text-[8px] font-mono tracking-[0.22em] uppercase text-slate-400/90 dark:text-slate-500 select-none font-semibold text-center"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          СМЕНА ТЕМЫ
        </div>

        {/* Кнопка-тумблер смены темы */}
        <button
          type="button"
          onClick={toggleTheme}
          className="group relative flex h-[38px] w-[38px] items-center justify-center rounded-[14px] bg-[#161a23] text-slate-300 hover:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-white/5 transition-all duration-200 active:scale-95"
          title={isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <IconMoon className="h-4 w-4 text-sky-300" stroke={2} />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ scale: 0.5, rotate: 90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <IconSun className="h-4 w-4 text-amber-400" stroke={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </aside>
  );
}
