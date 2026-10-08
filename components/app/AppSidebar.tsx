"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarNav,
  SidebarSection,
  SidebarItem,
  SidebarFooter,
  SidebarToggle,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  RotateCcw,
  ExternalLink,
  Wallet,
  Sun,
  Moon,
} from "lucide-react";
import {
  IconWallet,
  IconBuildingBank,
  IconTruckDelivery,
  IconShieldCheck,
} from "@tabler/icons-react";

function BrandMark() {
  const { collapsed } = useSidebar();
  return (
    <Link href="/app/donor" className="flex items-center gap-2.5 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/aidchain-icon.png"
        alt="AidChain"
        draggable={false}
        className="h-7 w-auto select-none shrink-0"
      />
      {!collapsed && (
        <span className="font-display font-medium text-sm tracking-tight text-[var(--color-text)] truncate">
          AidChain
        </span>
      )}
    </Link>
  );
}

function WalletFooter() {
  const { collapsed } = useSidebar();
  const { isConnected, formattedAddress, balanceSol } = usePhantomWallet();

  // Убрана дублирующая кнопка подключения (кошелёк подключается через шапку)
  if (!isConnected) {
    return null;
  }

  return (
    <div className={`flex w-full items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1 text-left">
          <div className="text-[12px] font-mono font-medium text-[var(--color-text)] truncate">
            {formattedAddress}
          </div>
          <div className="text-[11px] font-mono text-emerald-500 dark:text-emerald-400">
            {balanceSol !== null ? `${balanceSol.toFixed(2)} SOL` : "devnet"}
          </div>
        </div>
      )}
    </div>
  );
}

const SIDEBAR_STORAGE_KEY = "aidchain_sidebar_collapsed";

export function AppSidebar() {
  const pathname = usePathname();
  const { hitlQueue } = useAppStore();
  const { theme, toggleTheme } = useTheme();
  const pendingHitlCount = hitlQueue.filter((h) => h.status === "pending").length;

  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  const [mounted, setMounted] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch (_) {}
  }, []);

  const handleCollapsedChange = React.useCallback((next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch (_) {}
  }, []);

  const roles = [
    {
      id: "donor",
      label: "Донор",
      href: "/app/donor",
      icon: IconWallet,
    },
    {
      id: "foundation",
      label: "Фонд",
      href: "/app/foundation",
      icon: IconBuildingBank,
    },
    {
      id: "vendor",
      label: "Поставщик",
      href: "/app/vendor",
      icon: IconTruckDelivery,
    },
    {
      id: "admin",
      label: "Администратор",
      href: "/app/admin",
      icon: IconShieldCheck,
      badge: pendingHitlCount > 0 ? `${pendingHitlCount}` : undefined,
    },
  ];

  return (
    <Sidebar
      variant="collapsible"
      collapsed={mounted ? collapsed : false}
      onCollapsedChange={handleCollapsedChange}
      width={230}
      collapsedWidth={64}
      className="border-r border-[var(--color-border)] bg-[var(--color-bg)] transition-colors duration-200"
    >
      <SidebarHeader className="border-b border-[var(--color-border)]">
        <BrandMark />
        <SidebarToggle className="ml-auto" />
      </SidebarHeader>

      <SidebarNav>
        <SidebarSection label="Роли протокола">
          {roles.map((r) => {
            const isActive = pathname === r.href;
            const IconComp = r.icon;
            return (
              <SidebarItem
                key={r.id}
                icon={
                  <IconComp
                    className={`size-4 transition-colors ${
                      isActive ? "text-blue-500 dark:text-blue-400" : "text-slate-400"
                    }`}
                  />
                }
                active={isActive}
                href={r.href}
                badge={
                  r.badge ? (
                    <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-500 dark:text-amber-300">
                      {r.badge}
                    </span>
                  ) : undefined
                }
              >
                {r.label}
              </SidebarItem>
            );
          })}
        </SidebarSection>

        <SidebarSection label="Быстрые действия">
          <SidebarItem
            icon={
              theme === "dark" ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-indigo-500" />
              )
            }
            onClick={toggleTheme}
          >
            {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          </SidebarItem>
          <SidebarItem
            icon={<ExternalLink className="size-4 text-slate-400" />}
            href="/"
          >
            К лендингу
          </SidebarItem>
        </SidebarSection>
      </SidebarNav>

      <SidebarFooter>
        <WalletFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
