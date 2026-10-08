"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useSolanaMemo } from "@/hooks/useSolanaMemo";
import { TransactionStatusToast } from "@/components/app/TransactionStatusToast";
import {
  Truck,
  CheckCircle2,
  Wallet,
  Store,
  Loader2,
} from "lucide-react";

export default function VendorPage() {
  const { vendors, claimVendorPayout } = useAppStore();
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

  const [selectedVendorId, setSelectedVendorId] = useState<string>("v-1");
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);

  const currentVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];

  const handleClaimPayout = async (invoiceId: string, invoiceNumber: string, amountSol: number) => {
    if (!isConnected) {
      const connected = await connect();
      if (!connected) return;
    }

    setProcessingInvoiceId(invoiceId);
    const memoText = `[DIRECT VENDOR PAYOUT] Прямая выплата поставщику ${currentVendor.name} по счёту #${invoiceNumber} на сумму ${amountSol} SOL`;
    const result = await writeMemo(provider, memoText);

    if (result) {
      claimVendorPayout(currentVendor.id, invoiceId, result.signature, result.explorerUrl);
    }
    setProcessingInvoiceId(null);
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

      {/* Верхний баннер кабинета Поставщика: чистый светлый / обсидиановый стиль */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121827] p-6 sm:p-8 shadow-sm dark:shadow-md transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Truck className="h-3.5 w-3.5" />
              <span>B2B Панель аккредитованного поставщика</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
              Кабинет Поставщика: прямые расчеты из эскроу
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Деньги поступают напрямую из смарт-контракта на ваш кошелёк сразу после валидации накладной оракулом: без риска невыплат и задержек со стороны фонда.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#090d16] p-4 text-center transition-colors">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                Получено выплат
              </span>
              <div className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {currentVendor.totalPaidSol} SOL
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                ≈ ${(currentVendor.totalPaidSol * 150).toFixed(0)} USD
              </span>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-slate-50/70 dark:bg-[#090d16] p-4 text-center transition-colors">
              <span className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400/80 font-mono">
                Статус Whitelist
              </span>
              <div className="mt-1 font-display text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {currentVendor.status === "whitelisted" ? "Активен" : "На проверке"}
              </div>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 block mt-0.5">
                В смарт-контракте
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Выбор профиля компании поставщика */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121827] p-6 space-y-4 shadow-sm dark:shadow-md transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                  {currentVendor.name}
                </h3>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Whitelist ✓
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                БИН: <span className="font-mono text-slate-800 dark:text-slate-200">{currentVendor.bin}</span> : Категория: {currentVendor.category}
              </p>
            </div>
          </div>

          {/* Селектор контрагента */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Контрагент:</span>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#080b11] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] p-3 text-xs transition-colors">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Кошелёк для прямых выплат:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 truncate block mt-1">
              {currentVendor.walletAddress}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] p-3 text-xs transition-colors">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Успешных поставок:</span>
            <span className="text-slate-900 dark:text-white font-semibold block mt-1">
              {currentVendor.completedOrdersCount} закрытых накладных
            </span>
          </div>
          <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] p-3 text-xs transition-colors">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Комиссия за транш:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
              0% (Оплачивает смарт-контракт)
            </span>
          </div>
        </div>
      </div>

      {/* Реестр счетов и закрывающих документов */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Реестр инвойсов и прямых выплат
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Счета, выставленные по целевым благотворительным кампаниям
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Счетов: {currentVendor.invoices.length}
          </span>
        </div>

        {currentVendor.invoices.length === 0 ? (
          <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0e131f]/50 p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            У выбранного поставщика пока нет активных инвойсов.
          </div>
        ) : (
          <div className="space-y-3">
            {currentVendor.invoices.map((inv) => {
              const isProcessing = isWriting && processingInvoiceId === inv.id;

              return (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0e131f]/80 p-5 shadow-sm hover:border-slate-300 dark:hover:border-white/[0.15] transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Счёт #{inv.invoiceNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        от {inv.date}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-mono ${
                          inv.status === "paid"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30"
                        }`}
                      >
                        {inv.status === "paid" ? "Выплачено из эскроу ✓" : "Одобрен оракулом"}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {inv.campaignTitle}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{inv.milestoneTitle}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">К выплате:</span>
                      <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {inv.amountSol} SOL
                      </span>
                    </div>

                    {inv.status === "pending_verification" ? (
                      <button
                        onClick={() => handleClaimPayout(inv.id, inv.invoiceNumber, inv.amountSol)}
                        disabled={isWriting}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 px-4 py-2 text-xs font-bold active:scale-[0.98] transition shadow-sm disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Записываем...</span>
                          </>
                        ) : (
                          <>
                            <Wallet className="h-3.5 w-3.5 text-white dark:text-emerald-600" />
                            <span>Получить выплату из эскроу</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Переведено на кошелёк</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
