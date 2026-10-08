"use client";

import React, { useState } from "react";
import { AppStoreProvider } from "@/lib/store/app-store";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { FloatingDock } from "@/components/app/FloatingDock";
import { StudioSidebar } from "@/components/app/StudioSidebar";
import { StudioHeader } from "@/components/app/StudioHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ThemeProvider>
      <AppStoreProvider>
        {/* Внешний холст (Studio Canvas): мягкий нейтральный фон в точности как на референсе */}
        <div className="min-h-screen w-full bg-[#d6dbe2] dark:bg-[#070b12] text-slate-900 dark:text-slate-100 p-2 sm:p-4 lg:p-5 flex items-center justify-center transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-300 font-sans">
          {/* Главный контейнер рабочей области */}
          <div className="w-full max-w-[1560px] h-[95vh] max-h-[1080px] flex items-stretch gap-3 lg:gap-3.5">
            {/* 1. Левая плавающая островная колонка (Floating Dock / Rail из референса) */}
            <FloatingDock
              onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
              isSidebarOpen={!isSidebarCollapsed}
            />

            {/* 2. Основное окно macOS-приложения (Floating Studio Window) */}
            <div className="relative flex-1 h-full rounded-[24px] sm:rounded-[30px] lg:rounded-[34px] bg-[#f0f2f5] dark:bg-[#0d1320] border border-white/80 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18),0_10px_25px_-5px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] overflow-hidden flex flex-row transition-colors duration-200">
              {/* Левая панель навигации окна (Studio Sidebar с macOS-точками и деревом документов) */}
              <div className="hidden lg:block h-full shrink-0">
                <StudioSidebar
                  onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
                  isCollapsed={isSidebarCollapsed}
                />
              </div>

              {/* Мобильная всплывающая панель (Drawer для мобильных и планшетов) */}
              {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <div className="relative z-10 w-[270px] h-full shadow-2xl">
                    <StudioSidebar
                      onToggleCollapse={() => setIsMobileMenuOpen(false)}
                      isCollapsed={false}
                    />
                  </div>
                </div>
              )}

              {/* Правая рабочая область окна (Dashboard Canvas) */}
              <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto px-4 sm:px-7 lg:px-9 py-4 sm:py-6 scrollbar-thin">
                {/* Шапка окна: Dashboard / All Your Workflows And Permissions + ThemeToggle + Phantom Wallet */}
                <StudioHeader onToggleMobileMenu={() => setIsMobileMenuOpen(true)} />

                {/* Основное содержимое дашборда */}
                <main className="flex-1 pt-6 pb-12 min-w-0">
                  {children}
                </main>
              </div>
            </div>
          </div>
        </div>
      </AppStoreProvider>
    </ThemeProvider>
  );
}
