"use client";

import React, { useState, useEffect } from "react";
import { AppStoreProvider } from "@/lib/store/app-store";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
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

  // Полная блокировка зума (Ctrl + Колесико, Ctrl + +/-, тачпад пинч-зум)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        (e.key === "+" ||
          e.key === "-" ||
          e.key === "=" ||
          e.key === "_" ||
          e.key === "0" ||
          e.keyCode === 187 ||
          e.keyCode === 189 ||
          e.keyCode === 107 ||
          e.keyCode === 109)
      ) {
        e.preventDefault();
      }
    };

    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("gesturestart", handleGesture, { passive: false });
    window.addEventListener("gesturechange", handleGesture, { passive: false });
    window.addEventListener("gestureend", handleGesture, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("gesturestart", handleGesture);
      window.removeEventListener("gesturechange", handleGesture);
      window.removeEventListener("gestureend", handleGesture);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppStoreProvider>
        {/* Внешний холст: строго фиксированный fixed inset-0 с мягким атмосферным градиентом */}
        <div className="fixed inset-0 h-screen w-screen overflow-hidden overscroll-none select-none bg-gradient-to-br from-[#e1e6ef] via-[#d6dde8] to-[#e4e9f2] dark:from-[#060912] dark:via-[#090e1c] dark:to-[#05070e] text-slate-900 dark:text-slate-100 p-2 sm:p-3 lg:p-4 flex items-center justify-center transition-colors duration-300 selection:bg-emerald-500/20 selection:text-emerald-300 font-sans">
          {/* Рассеянные сферы света для реалистичного преломления матового стекла (Apple VisionOS эффект) */}
          <div className="absolute -top-20 left-10 w-[600px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-20 right-10 w-[650px] h-[550px] rounded-full bg-emerald-500/10 dark:bg-emerald-600/12 blur-[150px] pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full bg-indigo-500/6 dark:bg-indigo-500/10 blur-[130px] pointer-events-none" />

          {/* Главный контейнер рабочей области */}
          <div className="relative z-10 w-full max-w-[1560px] h-full max-h-[1040px] flex items-stretch gap-3 lg:gap-3.5 overflow-hidden">
            {/* 1. Левая плавающая островная колонка (Floating Dock) */}
            <FloatingDock
              onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
              isSidebarOpen={!isSidebarCollapsed}
            />

            {/* 2. Основное окно приложения в стиле Apple VisionOS Liquid Glass */}
            <div className="glass-window relative flex-1 h-full rounded-[24px] sm:rounded-[30px] lg:rounded-[34px] overflow-hidden flex flex-row transition-colors duration-200">
              {/* Левая панель навигации окна (Studio Sidebar с macOS traffic lights и 4 профилями) */}
              <div className="hidden lg:flex h-full shrink-0">
                <StudioSidebar isCollapsed={isSidebarCollapsed} />
              </div>

              {/* Мобильная всплывающая панель (Drawer для мобильных и планшетов) */}
              {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <div className="relative z-10 w-[270px] h-full shadow-2xl">
                    <StudioSidebar isCollapsed={false} />
                  </div>
                </div>
              )}

              {/* Правая рабочая область окна (Dashboard Canvas) */}
              <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto overscroll-contain px-4 sm:px-7 lg:px-9 py-4 sm:py-6 scrollbar-thin">
                {/* Шапка окна: Заголовок страницы + Phantom Wallet */}
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
    </LanguageProvider>
  </ThemeProvider>
  );
}
