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
import { useLanguage } from "@/components/providers/LanguageProvider";

interface FloatingDockProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function FloatingDock({ onToggleSidebar, isSidebarOpen }: FloatingDockProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === "dark";

  return (
    <aside
      aria-label="Боковая панель быстрого доступа"
      className="hidden lg:flex flex-col gap-3.5 select-none shrink-0 py-4 pl-4 pr-1 z-30"
    >
      {/* Верхний сегмент (Tall Capsule) */}
      <div className="w-[58px] flex flex-col items-center p-1.5 rounded-[28px] bg-white/70 dark:bg-[#0c1220]/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-colors duration-200">
        {/* Инсетный трек с иконками */}
        <div className="w-[44px] bg-slate-200/60 dark:bg-[#151a26] rounded-[22px] py-2 px-1 flex flex-col items-center gap-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] border border-slate-300/50 dark:border-white/5 transition-colors duration-200">
          {/* 1. Верхний логотип: Наш официальный логотип AidChain */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Link
              href="/app/donor"
              className="flex h-9 w-9 items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition group rounded-xl overflow-hidden p-0.5 hover:bg-black/5 dark:hover:bg-white/5"
              title="AidChain Protocol"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/aidchain-icon.png"
                alt="AidChain Logo"
                className="h-7 w-7 object-contain drop-shadow-xs"
              />
            </Link>
          </motion.div>

          {/* 1. Донор */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Link
              href="/app/donor"
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                pathname === "/app/donor"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-300/80 dark:bg-white/15 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] dark:border-white/15"
                  : "text-slate-500 hover:text-slate-900 hover:bg-black/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
              }`}
              title={t("dockDonor", "1. Кабинет Донора")}
            >
              <IconHeartHandshake className="h-4 w-4" stroke={1.9} />
            </Link>
          </motion.div>

          {/* 2. Перевозчик (Поставщик) */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Link
              href="/app/vendor"
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                pathname === "/app/vendor"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-300/80 dark:bg-white/15 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] dark:border-white/15"
                  : "text-slate-500 hover:text-slate-900 hover:bg-black/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
              }`}
              title={t("dockVendor", "2. Кабинет Перевозчика / Поставщика")}
            >
              <IconTruckDelivery className="h-4 w-4" stroke={1.9} />
            </Link>
          </motion.div>

          {/* 3. Фонд */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Link
              href="/app/foundation"
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                pathname === "/app/foundation"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-300/80 dark:bg-white/15 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] dark:border-white/15"
                  : "text-slate-500 hover:text-slate-900 hover:bg-black/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
              }`}
              title={t("dockFoundation", "3. Кабинет Благотворительного Фонда")}
            >
              <IconBuildingBank className="h-4 w-4" stroke={1.9} />
            </Link>
          </motion.div>

          {/* 4. Админ */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Link
              href="/app/admin"
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                pathname === "/app/admin"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-300/80 dark:bg-white/15 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] dark:border-white/15"
                  : "text-slate-500 hover:text-slate-900 hover:bg-black/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
              }`}
              title={t("dockAdmin", "4. Панель Администратора & HITL")}
            >
              <IconShieldCheck className="h-4 w-4" stroke={1.9} />
            </Link>
          </motion.div>

          {/* 5. Кнопка скрытия/показа внутреннего сайдбара (последняя после 4 профилей) */}
          <motion.button
            type="button"
            onClick={onToggleSidebar}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
              isSidebarOpen === false
                ? "bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white"
                : "text-slate-500 hover:text-slate-900 hover:bg-black/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
            }`}
            title={isSidebarOpen === false ? t("dockExpandSidebar", "Развернуть боковое меню") : t("dockCollapseSidebar", "Скрыть боковое меню")}
          >
            <IconLayoutSidebar className="h-4 w-4" stroke={1.8} />
          </motion.button>
        </div>
      </div>

      {/* Нижний сегмент (Theme & Language Dual Capsule) */}
      <div className="w-[58px] flex flex-col items-center gap-2 p-2 rounded-[28px] bg-white/70 dark:bg-[#0c1220]/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-colors duration-200">
        {/* Кнопка смены языка (RU / EN) */}
        <motion.button
          type="button"
          onClick={toggleLanguage}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="group relative flex h-[34px] w-[38px] items-center justify-center rounded-[12px] bg-slate-200/60 dark:bg-[#151a26] text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-slate-300/50 dark:border-white/5 transition-colors font-mono font-extrabold text-[11px]"
          title={language === "ru" ? "Switch to English" : "Переключить на русский"}
        >
          <span>{language.toUpperCase()}</span>
        </motion.button>

        {/* Кнопка-тумблер смены темы */}
        <motion.button
          type="button"
          onClick={toggleTheme}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="group relative flex h-[34px] w-[38px] items-center justify-center rounded-[12px] bg-slate-200/60 dark:bg-[#151a26] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-slate-300/50 dark:border-white/5 transition-colors"
          title={isDark ? t("dockLightMode", "Переключить на светлую тему") : t("dockDarkMode", "Переключить на тёмную тему")}
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
                exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <IconSun className="h-4 w-4 text-amber-500" stroke={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </aside>
  );
}
