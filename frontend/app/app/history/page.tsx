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
        <div className="glass-card relative overflow-hidden rounded-[26px] p-5 sm:p-6 transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
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

        <div className="glass-card relative overflow-hidden rounded-[26px] p-5 sm:p-6 transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Сеть блокчейна</span>
            <Radio className="h-4 w-4 text-blue-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
              Solana Network
            </span>
            <span className="text-xs text-slate-400">Cluster Live</span>
          </div>
        </div>

        <div className="glass-card relative overflow-hidden rounded-[26px] p-5 sm:p-6 transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
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
