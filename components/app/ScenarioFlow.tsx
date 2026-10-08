"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store/app-store";
import {
  ArrowRight,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  IconRoute,
  IconWallet,
  IconFileCheck,
  IconCpu,
  IconTruckDelivery,
} from "@tabler/icons-react";

export function ScenarioFlow() {
  const pathname = usePathname();
  const { hitlQueue, resetToDefaults } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const pendingHitlCount = hitlQueue.filter((h) => h.status === "pending").length;

  const steps = [
    {
      role: "Донор",
      path: "/app/donor",
      title: "Взнос в эскроу",
      desc: "Деньги блокируются в смарт-контракте, а не у фонда",
      icon: IconWallet,
    },
    {
      role: "Фонд",
      path: "/app/foundation",
      title: "Смета и чек",
      desc: "Закупка товаров, SHA-256 хэширование чека",
      icon: IconFileCheck,
    },
    {
      role: "AI / Админ",
      path: "/app/admin",
      title: "Верификация оракулом",
      desc: "OCR сверка со сметой или ручной HITL-арбитраж",
      badge: pendingHitlCount > 0 ? `${pendingHitlCount} на проверке` : null,
      icon: IconCpu,
    },
    {
      role: "Поставщик",
      path: "/app/vendor",
      title: "Прямая выплата",
      desc: "Транш переводится из эскроу напрямую поставщику",
      icon: IconTruckDelivery,
    },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 sm:p-4 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
            <IconRoute className="h-4 w-4" stroke={1.8} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-text)] font-sans tracking-[0.005em]">
              Демо-сценарий
            </h3>
            <p className="text-[11px] text-[var(--color-text-muted)] hidden sm:block">
              Пройдите цепочку протокола от лица каждого участника
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm("Сбросить демо-данные к исходному состоянию?")) {
                resetToDefaults();
              }
            }}
            title="Сбросить состояние к начальным данным"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition active:scale-[0.98]"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Сброс демо</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
          >
            <span>{isExpanded ? "Скрыть шаги сценария" : "Показать шаги сценария"}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-[var(--color-text-muted)]" /> : <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-[var(--color-border)]">
          {steps.map((s, idx) => {
            const isActive = pathname === s.path;
            const Icon = s.icon;

            return (
              <Link
                key={s.path}
                href={s.path}
                className={`relative flex items-start gap-3 rounded-xl p-2.5 transition-all group ${
                  isActive
                    ? "bg-emerald-500/10 border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                    : "bg-[var(--color-bg)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20"
                      : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-[var(--color-text)]"
                      }`}
                    >
                      {s.title}
                    </span>
                    {s.badge && (
                      <span className="shrink-0 rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-amber-500 dark:text-amber-300">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] leading-tight mt-0.5 line-clamp-1">
                    {s.desc}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-3 w-3 text-[var(--color-border)] pointer-events-none" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
