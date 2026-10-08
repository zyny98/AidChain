import type { Metadata } from "next";
import { AppStoreProvider } from "@/lib/store/app-store";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppHeader } from "@/components/app/AppHeader";
import { ScenarioFlow } from "@/components/app/ScenarioFlow";

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "AidChain dApp: Целевая гуманитарная платформа",
  description:
    "Децентрализованная платформа целевых пожертвований с non-custodial эскроу на Solana Devnet и AI-верификацией чеков.",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AppStoreProvider>
        <div className="flex h-screen w-full overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-300 font-sans">
          {/* Боковая сворачиваемая панель навигации (Sidebar) */}
          <AppSidebar />

          {/* Основная рабочая область */}
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden min-w-0">
            <AppHeader />

            <main className="relative z-10 flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <ScenarioFlow />
              {children}
            </main>
          </div>
        </div>
      </AppStoreProvider>
    </ThemeProvider>
  );
}
