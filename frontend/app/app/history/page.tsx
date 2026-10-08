"use client";

import React from "react";
import { AuditTrailTable } from "@/components/app/AuditTrailTable";
import { useAppStore } from "@/lib/store/app-store";
import { ShieldCheck, Database, Radio } from "lucide-react";

export default function HistoryPage() {
  const { auditRecords } = useAppStore();

  return (
    <div className="space-y-6 font-sans">
      {/* Верхние сводные плашки */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[22px] border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)]">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Всего транзакций</span>
            <Database className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-light tracking-tight text-slate-800 dark:text-white font-mono">
              {auditRecords.length}
            </span>
            <span className="text-xs text-slate-400">записей SPL Memo</span>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)]">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Сеть блокчейна</span>
            <Radio className="h-4 w-4 text-blue-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
              Solana Devnet
            </span>
            <span className="text-xs text-slate-400">Cluster Live</span>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)]">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Статус неизменяемости</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-sans">
              100% Верифицировано
            </span>
          </div>
        </div>
      </div>

      {/* Основная таблица транзакций */}
      <AuditTrailTable />
    </div>
  );
}
