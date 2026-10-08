"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import {
  IconLayoutDashboard,
  IconBuildingBank,
  IconTruckDelivery,
  IconShieldCheck,
  IconTarget,
  IconBell,
  IconUsers,
  IconClock,
  IconArchive,
  IconSearch,
  IconFolder,
  IconFolderOpen,
  IconFileText,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
  IconLayoutSidebar,
} from "@tabler/icons-react";

interface StudioSidebarProps {
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export function StudioSidebar({ onToggleCollapse, isCollapsed }: StudioSidebarProps) {
  const pathname = usePathname();
  const { hitlQueue, campaigns } = useAppStore();
  const { formattedAddress, isConnected } = usePhantomWallet();

  const pendingHitlCount = hitlQueue.filter((h) => h.status === "pending").length;

  // Раскрывающиеся ветки в блоке Documents
  const [folderOpen, setFolderOpen] = useState<Record<string, boolean>>({
    system: true,
    updates: true,
  });

  const [docSearch, setDocSearch] = useState("");
  const [activeDoc, setActiveDoc] = useState("fundimentals");

  const toggleFolder = (key: string) => {
    setFolderOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className={`flex flex-col h-full select-none border-r border-slate-200/80 dark:border-white/10 bg-[#eef1f5]/90 dark:bg-[#0f1422]/90 backdrop-blur-md transition-all duration-300 ${
        isCollapsed ? "w-0 p-0 overflow-hidden opacity-0 pointer-events-none" : "w-[260px] p-3.5"
      }`}
    >
      {/* 1. Верхний бар сайдбара: 3 кругляшка macOS (Traffic Lights) и кнопка сворачивания */}
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

        {/* Кнопка скрытия боковой колонки */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition"
            title="Скрыть боковую панель"
          >
            <IconLayoutSidebar className="h-3.5 w-3.5" stroke={1.8} />
          </button>
        )}
      </div>

      {/* 2. Профиль пользователя с аватаром (стилистика иллюстрации как в референсе) */}
      <div className="flex items-center gap-3 px-1.5 py-2 mb-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition cursor-pointer">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e232e] text-white overflow-hidden shadow-sm border border-slate-300 dark:border-white/10">
          {/* Стилизованная иконка аватара с очками из референса */}
          <svg className="h-8 w-8 text-slate-200" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="16" r="8" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
            {/* Очки */}
            <circle cx="17" cy="16" r="3" stroke="#0f172a" strokeWidth="1.5" fill="#ffffff" />
            <circle cx="23" cy="16" r="3" stroke="#0f172a" strokeWidth="1.5" fill="#ffffff" />
            <line x1="20" y1="16" x2="20" y2="16" stroke="#0f172a" strokeWidth="1.5" />
            {/* Волосы */}
            <path d="M12 14c2-5 12-6 16-2" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            {/* Тело / плечи */}
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
        {/* Секция: Projects */}
        <div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
            Projects
          </span>
          <nav className="space-y-1">
            {/* 1. Главный Dashboard (Активный, с глянцевой эмбоссированной плашкой и бейджем 0) */}
            <Link
              href="/app/donor"
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                pathname === "/app/donor"
                  ? "bg-gradient-to-b from-white to-white/75 dark:from-white/15 dark:to-white/5 border border-white dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconLayoutDashboard className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-200" stroke={1.9} />
                <span className="truncate">Dashboard</span>
              </div>
              <span className="rounded-full bg-slate-200/70 dark:bg-white/10 px-2 py-0.2 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-medium">
                0
              </span>
            </Link>

            {/* 2. Library (Кабинет Фонда) */}
            <Link
              href="/app/foundation"
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                pathname === "/app/foundation"
                  ? "bg-gradient-to-b from-white to-white/75 dark:from-white/15 dark:to-white/5 border border-white dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconBuildingBank className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" stroke={1.8} />
                <span className="truncate">Library (Фонд)</span>
              </div>
              <span className="rounded-full bg-slate-200/50 dark:bg-white/5 px-1.5 py-0.2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {campaigns.length}
              </span>
            </Link>

            {/* 3. Shared Projects (Кабинет Поставщика B2B) */}
            <Link
              href="/app/vendor"
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                pathname === "/app/vendor"
                  ? "bg-gradient-to-b from-white to-white/75 dark:from-white/15 dark:to-white/5 border border-white dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconTruckDelivery className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" stroke={1.8} />
                <span className="truncate">Shared Projects</span>
              </div>
            </Link>

            {/* 4. HITL Arbitrage (Администратор) */}
            <Link
              href="/app/admin"
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                pathname === "/app/admin"
                  ? "bg-gradient-to-b from-white to-white/75 dark:from-white/15 dark:to-white/5 border border-white dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconShieldCheck className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" stroke={1.8} />
                <span className="truncate">Admin & HITL</span>
              </div>
              {pendingHitlCount > 0 && (
                <span className="rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                  {pendingHitlCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Секция: Status */}
        <div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
            Status
          </span>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between rounded-lg px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 transition cursor-pointer">
              <div className="flex items-center gap-2.5">
                <IconTarget className="h-4 w-4 text-slate-500" stroke={1.8} />
                <span>New</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">3</span>
            </div>

            <div className="flex items-center justify-between rounded-lg px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 transition cursor-pointer">
              <div className="flex items-center gap-2.5">
                <IconBell className="h-4 w-4 text-slate-500" stroke={1.8} />
                <span>Updates</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">2</span>
            </div>

            <div className="flex items-center justify-between rounded-lg px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 transition cursor-pointer">
              <div className="flex items-center gap-2.5">
                <IconUsers className="h-4 w-4 text-slate-500" stroke={1.8} />
                <span>Team Review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Секция: History */}
        <div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
            History
          </span>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 transition cursor-pointer">
              <IconClock className="h-4 w-4 text-slate-500" stroke={1.8} />
              <span>Recently Edited</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 transition cursor-pointer">
              <IconArchive className="h-4 w-4 text-slate-500" stroke={1.8} />
              <span>Archive</span>
            </div>
          </div>
        </div>

        {/* Разделитель */}
        <div className="border-t border-slate-200/80 dark:border-white/10 my-2 mx-1" />

        {/* Секция: Documents (Иерархическое дерево документов и папок как в референсе) */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              Documents
            </span>
            <button
              type="button"
              className="h-4 w-4 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              title="Добавить документ"
            >
              <IconPlus className="h-3.5 w-3.5" stroke={2} />
            </button>
          </div>

          {/* Инпут поиска по документам в виде капсулы */}
          <div className="relative mb-2">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 pl-8 pr-2.5 py-1 text-[11px] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition"
            />
          </div>

          {/* Дерево файлов */}
          <div className="space-y-0.5 text-[11px]">
            {/* Папка 1: System Management's */}
            <div>
              <div
                onClick={() => toggleFolder("system")}
                className="flex items-center justify-between rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer font-medium"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {folderOpen.system ? (
                    <IconFolderOpen className="h-3.5 w-3.5 text-slate-500" stroke={1.8} />
                  ) : (
                    <IconFolder className="h-3.5 w-3.5 text-slate-500" stroke={1.8} />
                  )}
                  <span className="truncate">System Management's</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">12</span>
              </div>

              {/* Вложенный уровень */}
              {folderOpen.system && (
                <div className="pl-3.5 ml-2 border-l border-slate-200/80 dark:border-white/10 space-y-0.5 mt-0.5">
                  {/* Подпапка: 2025 Update's */}
                  <div>
                    <div
                      onClick={() => toggleFolder("updates")}
                      className="flex items-center justify-between rounded-md px-1.5 py-0.5 text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <IconFolder className="h-3 w-3 text-slate-400" stroke={1.8} />
                        <span className="truncate">2025 Update's</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">2</span>
                    </div>

                    {folderOpen.updates && (
                      <div className="pl-3 ml-1.5 border-l border-slate-200/70 dark:border-white/10 space-y-0.5 mt-0.5">
                        <div className="flex items-center justify-between rounded px-1.5 py-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <IconFileText className="h-3 w-3 text-slate-400" stroke={1.6} />
                            <span className="truncate">Hiring Process</span>
                          </div>
                          <span className="text-[9.5px] font-mono">4</span>
                        </div>
                        <div className="flex items-center justify-between rounded px-1.5 py-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <IconFileText className="h-3 w-3 text-slate-400" stroke={1.6} />
                            <span className="truncate">Billing Process</span>
                          </div>
                          <span className="text-[9.5px] font-mono">3</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Активный пункт Fundimentals (выделен плашкой как в референсе) */}
                  <div
                    onClick={() => setActiveDoc("fundimentals")}
                    className={`flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer transition ${
                      activeDoc === "fundimentals"
                        ? "bg-slate-300/60 dark:bg-white/10 text-slate-900 dark:text-white font-medium"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <IconFolder className="h-3.5 w-3.5 text-slate-500" stroke={1.8} />
                      <span className="truncate">Fundimentals</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-300">4</span>
                  </div>

                  {/* Папка: Off Grid Servers */}
                  <div
                    onClick={() => setActiveDoc("servers")}
                    className={`flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer transition ${
                      activeDoc === "servers"
                        ? "bg-slate-300/60 dark:bg-white/10 text-slate-900 dark:text-white font-medium"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <IconFolder className="h-3.5 w-3.5 text-slate-500" stroke={1.8} />
                      <span className="truncate">Off Grid Servers</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">5</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
