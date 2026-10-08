"use client";

import React, { useState } from "react";
import { useAppStore, HitlItem } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useSolanaMemo } from "@/hooks/useSolanaMemo";
import { TransactionStatusToast } from "@/components/app/TransactionStatusToast";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  FileSearch,
  AlertTriangle,
  Building,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function AdminPage() {
  const { hitlQueue, vendors, adminApproveHitl, adminRejectHitl, toggleVendorWhitelist } =
    useAppStore();
  const { provider, isConnected, connect } = usePhantomWallet();
  const {
    isWriting,
    status: txStatus,
    statusMessage,
    lastSignature,
    lastExplorerUrl,
    error: txError,
    writeMemo,
    resetStatus,
  } = useSolanaMemo();

  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
  const [selectedHitl, setSelectedHitl] = useState<HitlItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingHitlId, setProcessingHitlId] = useState<string | null>(null);

  const pendingHitlItems = hitlQueue.filter((h) => h.status === "pending");
  const resolvedHitlItems = hitlQueue.filter((h) => h.status !== "pending");

  const handleApproveHitl = async (item: HitlItem) => {
    if (!isConnected) {
      const connected = await connect();
      if (!connected) return;
    }

    setProcessingHitlId(item.id);
    const memoText = `[HITL OVERRIDE APPROVED] Администратор одобрил спорный чек ${item.fileName} (${item.claimedAmountSol} SOL) для этапа «${item.milestoneTitle}»`;
    const result = await writeMemo(provider, memoText);

    if (result) {
      adminApproveHitl(item.id, result.signature, result.explorerUrl);
    }
    setProcessingHitlId(null);
  };

  const handleRejectHitlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHitl) return;

    if (!isConnected) {
      const connected = await connect();
      if (!connected) return;
    }

    setProcessingHitlId(selectedHitl.id);
    const memoText = `[REPORT REJECTED] Администратор отклонил чек ${selectedHitl.fileName}: "${rejectReason}"`;
    const result = await writeMemo(provider, memoText);

    if (result) {
      adminRejectHitl(selectedHitl.id, rejectReason, result.signature, result.explorerUrl);
      setShowRejectModal(false);
      setSelectedHitl(null);
      setRejectReason("");
    }
    setProcessingHitlId(null);
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      <TransactionStatusToast
        status={txStatus}
        statusMessage={statusMessage}
        signature={lastSignature}
        explorerUrl={lastExplorerUrl}
        error={txError}
        onClose={resetStatus}
      />

      {/* Верхний баннер Администратора: чистый светлый / обсидиановый стиль */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121827] p-6 sm:p-8 shadow-sm dark:shadow-md transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>HITL Модуль: Human-in-the-Loop</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
              Панель Администратора и Оракул-валидатор
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Ручной арбитраж спорных чеков с низким AI Confidence Score (&lt; 80%), предотвращение фрода, аккредитация поставщиков и запись вердиктов в блокчейн Solana.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.03] p-4 text-center transition-colors">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                Очередь HITL
              </span>
              <div className="mt-1 font-display text-2xl font-bold text-amber-500 dark:text-amber-400">
                {pendingHitlItems.length}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Требуют решения
              </span>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-slate-50/70 dark:bg-emerald-500/[0.05] p-4 text-center transition-colors">
              <span className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400/80 font-mono">
                Точность AI
              </span>
              <div className="mt-1 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                98.4%
              </div>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 block mt-0.5">
                Метрика модели
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Очередь спорных чеков (HITL) с вкладками */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Очередь спорных чеков (HITL Арбитраж)
            </h2>
          </div>

          {/* Вкладки: Требуют внимания / Решенные */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] p-1 text-xs">
            <button
              onClick={() => setActiveTab("pending")}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === "pending"
                  ? "bg-white text-slate-900 font-bold border border-slate-200 shadow-xs dark:bg-white/[0.1] dark:text-white dark:border-white/[0.12]"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              К рассмотрению ({pendingHitlItems.length})
            </button>
            <button
              onClick={() => setActiveTab("resolved")}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === "resolved"
                  ? "bg-white text-slate-900 font-bold border border-slate-200 shadow-xs dark:bg-white/[0.1] dark:text-white dark:border-white/[0.12]"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              История решений ({resolvedHitlItems.length})
            </button>
          </div>
        </div>

        {activeTab === "pending" ? (
          pendingHitlItems.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0e131f]/50 p-10 text-center space-y-2 shadow-sm">
              <ShieldCheck className="h-9 w-9 text-emerald-500 dark:text-emerald-400 mx-auto opacity-70" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Очередь HITL пуста</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Все загруженные чеки прошли автоматическую верификацию AI-оракулом с высоким показателем уверенности.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingHitlItems.map((item) => {
                const isProcessing = isWriting && processingHitlId === item.id;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-amber-500/30 bg-white dark:bg-[#121827] p-6 space-y-5 shadow-sm dark:shadow-md transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-white/[0.06]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-300 font-semibold">
                            Confidence: {item.confidenceScore}% (Ниже порога 80%)
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {item.createdAt}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mt-1">
                          {item.campaignTitle}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{item.milestoneTitle}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">Заявлено к выплате:</span>
                        <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {item.claimedAmountSol} SOL{" "}
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                            (по смете: {item.budgetAmountSol} SOL)
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Флаги предупреждений антифрода */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Флаги антифрод-системы:</span>
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-200 list-disc list-inside">
                        {item.flags.map((flag, idx) => (
                          <li key={idx}>{flag}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Распознанные позиции vs Документ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] p-4 space-y-2 transition-colors">
                        <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono block">
                          Реквизиты продавца:
                        </span>
                        <div className="text-slate-900 dark:text-white font-semibold">{item.vendorName}</div>
                        <div className="text-slate-600 dark:text-slate-400 font-mono">БИН: {item.vendorBin}</div>
                        <div className="text-slate-600 dark:text-slate-400 font-mono">Файл: {item.fileName}</div>
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 break-all">
                          SHA-256: {item.fileHashSha256}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] p-4 space-y-2 transition-colors">
                        <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono block">
                          Товарные позиции в чеке:
                        </span>
                        {item.ocrItems.map((ocrItem, i) => (
                          <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300">
                            <span>{ocrItem.name} ({ocrItem.qty} шт)</span>
                            <span className="font-mono text-slate-900 dark:text-white font-semibold">
                              {(ocrItem.qty * ocrItem.priceSol).toFixed(2)} SOL
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Кнопки арбитража */}
                    <div className="pt-4 border-t border-slate-200/70 dark:border-white/[0.06] flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleApproveHitl(item)}
                        disabled={isWriting}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 hover:bg-emerald-700 dark:hover:bg-emerald-400 active:scale-[0.98] py-2.5 px-4 text-xs font-bold transition shadow-sm disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Записываем решение в блокчейн...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Одобрить транш вручную (Solana Memo)</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedHitl(item);
                          setShowRejectModal(true);
                        }}
                        disabled={isWriting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 px-5 text-xs font-bold text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 active:scale-[0.98] transition disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Отклонить отчёт</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="space-y-3">
            {resolvedHitlItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0e131f]/70 p-4 text-xs flex items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {item.status === "approved" ? "Одобрено вручную" : "Отклонено"}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.campaignTitle}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {item.milestoneTitle} : Чек: {item.fileName} ({item.claimedAmountSol} SOL)
                  </p>
                </div>
                <div className="text-right text-slate-500 text-[11px] font-mono">
                  {item.createdAt}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Управление Whitelist поставщиков */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Реестр аккредитованных поставщиков (Whitelist)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Аккредитовано: {vendors.filter((v) => v.status === "whitelisted").length} / {vendors.length}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121827] p-5 overflow-x-auto shadow-sm dark:shadow-md transition-colors">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                <th className="pb-3 pl-2">Организация / Поставщик</th>
                <th className="pb-3 px-3">БИН</th>
                <th className="pb-3 px-3">Категория</th>
                <th className="pb-3 px-3">Статус Whitelist</th>
                <th className="pb-3 pr-2 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.04]">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pl-2 font-medium text-slate-900 dark:text-white">
                    {vendor.name}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                    {vendor.bin}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {vendor.category}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        vendor.status === "whitelisted"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {vendor.status === "whitelisted" ? "Аккредитован ✓" : "На проверке"}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <button
                      onClick={() => toggleVendorWhitelist(vendor.id)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition active:scale-[0.98] ${
                        vendor.status === "whitelisted"
                          ? "border border-rose-500/30 text-rose-600 dark:text-rose-300 hover:bg-rose-500/10"
                          : "border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {vendor.status === "whitelisted" ? "Исключить" : "Аккредитовать"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Модалка отклонения отчета */}
      {showRejectModal && selectedHitl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0e131f]/95 p-6 shadow-2xl backdrop-blur-2xl transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display mb-2">
              Отклонение отчёта по чеку
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Укажите причину отклонения для фиксации в блокчейне и запуска возврата донорам:
            </p>

            <form onSubmit={handleRejectHitlSubmit} className="space-y-4">
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Например: Несоответствие товарных позиций смете, нечитаемый QR-код ОФД..."
                className="w-full rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-white/[0.04] px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none transition-colors"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isWriting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                >
                  {isWriting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Записываем отказ...</span>
                    </>
                  ) : (
                    <span>Зафиксировать отказ в блокчейне</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white transition"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
