"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store/app-store";
import { ExternalLink, ShieldCheck, Clock, Search } from "lucide-react";

export function AuditTrailTable() {
  const { auditRecords } = useAppStore();
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = auditRecords.filter((rec) => {
    const matchesRole = filterRole === "all" || rec.role === filterRole;
    const matchesSearch =
      rec.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.signature && rec.signature.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#121827] p-5 md:p-6 shadow-md font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-display tracking-tight">
              Неизменяемый блокчейн-реестр (Audit Trail)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Публичные транзакции SPL Memo в сети Solana Devnet
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по записи..."
              className="rounded-xl border border-white/[0.1] bg-white/[0.04] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Фильтр по роли */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-xl border border-white/[0.1] bg-[#080b11] px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Все роли</option>
            <option value="donor">Доноры</option>
            <option value="foundation">Фонды</option>
            <option value="vendor">Поставщики</option>
            <option value="admin">Администраторы</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Нет записей, соответствующих критериям поиска.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 uppercase tracking-wider font-mono">
                <th className="pb-3 pl-2">Событие / Текст Memo</th>
                <th className="pb-3 px-3">Роль</th>
                <th className="pb-3 px-3">Время (UTC)</th>
                <th className="pb-3 px-3">Статус</th>
                <th className="pb-3 pr-2 text-right">Solana Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((record) => (
                <tr
                  key={record.id}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 pl-2 font-mono text-slate-200 max-w-md break-words">
                    <span className="font-sans text-xs text-white">{record.text}</span>
                    {record.signature && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-xs">
                        Tx: {record.signature}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                        record.role === "donor"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : record.role === "foundation"
                          ? "bg-sky-500/10 text-sky-300 border border-sky-500/20"
                          : record.role === "vendor"
                          ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      }`}
                    >
                      {record.role === "donor"
                        ? "Донор"
                        : record.role === "foundation"
                        ? "Фонд"
                        : record.role === "vendor"
                        ? "Поставщик"
                        : "Админ"}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {record.timestamp}
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Подтверждено
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right whitespace-nowrap">
                    {record.explorerUrl ? (
                      <a
                        href={record.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] active:scale-[0.98] transition"
                      >
                        Посмотреть запись
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </a>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Локальный хэш</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
