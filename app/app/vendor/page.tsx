"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useSolanaMemo } from "@/hooks/useSolanaMemo";
import { TransactionStatusToast } from "@/components/app/TransactionStatusToast";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Truck,
  CheckCircle2,
  Wallet,
  Store,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

function localizeVendorName(name: string, lang: string): string {
  if (lang !== "en") return name;
  if (name.includes("КазПолимер")) return "KazPolymer Stroy LLC";
  if (name.includes("МедФарм")) return "MedPharm Astana LLC";
  if (name.includes("МедСнаб")) return "MedSnab Trade LLC";
  return name;
}

function localizeVendorCategory(cat: string, lang: string): string {
  if (lang !== "en") return cat;
  if (cat.includes("полимерные")) return "Construction & Polymer Surfaces";
  if (cat.includes("оборудование")) return "Medical Equipment & Pharmaceuticals";
  if (cat.includes("ортопедия")) return "Medical Devices & Orthopedics";
  return cat;
}

function localizeInvoiceCampaign(title: string, lang: string): string {
  if (lang !== "en") return title;
  if (title.includes("детской площадки")) return "Inclusive Children's Playground Renovation";
  if (title.includes("реабилитационного центра") || title.includes("детского центра")) return "Pediatric Rehabilitation Center Medications";
  return title;
}

function localizeInvoiceMilestone(title: string, lang: string): string {
  if (lang !== "en") return title;
  if (title.includes("резиновой крошки")) return "Stage 2: Rubber Granules & Adhesive Procurement";
  if (title.includes("бронирование партии")) return "Stage 1: Advance for Medical Batch Reservation";
  if (title.includes("ортопедических корсетов")) return "Stage 2: Customized Orthopedic Braces Procurement";
  return title;
}

export default function VendorPage() {
  const { language, t } = useLanguage();
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
  const [copied, setCopied] = useState(false);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);

  const currentVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];

  const handleClaimPayout = async (invoiceId: string, invoiceNumber: string, amountSol: number) => {
    if (!isConnected) {
      const connected = await connect();
      if (!connected) return;
    }

    setProcessingInvoiceId(invoiceId);
    const memoText = `[DIRECT VENDOR PAYOUT] Direct payout to supplier ${currentVendor.name} on invoice #${invoiceNumber} for ${amountSol} SOL`;
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
      <div className="relative overflow-hidden rounded-[26px] glass-card p-6 sm:p-8 transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Truck className="h-3.5 w-3.5" />
              <span>{language === "ru" ? "B2B Панель аккредитованного поставщика" : "B2B Whitelisted Vendor Portal"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
              {t("vendorBannerTitle")}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {t("vendorBannerDesc")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
            <div className="rounded-2xl glass-card-subtle p-4 text-center transition-colors">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                {language === "ru" ? "Получено выплат" : "Total Paid"}
              </span>
              <div className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {currentVendor.totalPaidSol} SOL
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                ≈ ${(currentVendor.totalPaidSol * 150).toFixed(0)} USD
              </span>
            </div>

            <div className="rounded-2xl glass-card-subtle border border-emerald-500/20 p-4 text-center transition-colors">
              <span className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400/80 font-mono">
                {language === "ru" ? "Статус Whitelist" : "Whitelist Status"}
              </span>
              <div className="mt-1 font-display text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {currentVendor.status === "whitelisted" ? (language === "ru" ? "Активен" : "Active") : (language === "ru" ? "На проверке" : "Pending")}
              </div>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 block mt-0.5">
                {language === "ru" ? "В смарт-контракте" : "In smart contract"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Выбор профиля компании поставщика */}
      <div className="rounded-[24px] glass-card p-6 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                  {localizeVendorName(currentVendor.name, language)}
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Whitelist ✓
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === "ru" ? "БИН:" : "Tax ID / BIN:"} <span className="font-mono text-slate-800 dark:text-slate-200">{currentVendor.bin}</span> : {language === "ru" ? "Категория:" : "Category:"} {localizeVendorCategory(currentVendor.category, language)}
              </p>
            </div>
          </div>

          {/* Селектор контрагента */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">{language === "ru" ? "Контрагент:" : "Contractor:"}</span>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="rounded-xl border border-black/10 dark:border-white/[0.12] bg-white/80 dark:bg-[#080b11] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors cursor-pointer"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {localizeVendorName(v.name, language)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="rounded-xl glass-card-subtle p-3 text-xs transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>{t("vendorWalletLabel")}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(currentVendor.walletAddress);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                title={language === "ru" ? "Скопировать адрес" : "Copy address"}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? t("vendorCopiedWallet") : t("vendorCopyWallet")}</span>
              </button>
            </div>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 truncate block mt-1 select-all" title={currentVendor.walletAddress}>
              {currentVendor.walletAddress}
            </span>
          </div>
          <div className="rounded-xl glass-card-subtle p-3 text-xs transition-colors">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{language === "ru" ? "Успешных поставок:" : "Successful Deliveries:"}</span>
            <span className="text-slate-900 dark:text-white font-semibold block mt-1">
              {currentVendor.completedOrdersCount} {language === "ru" ? "закрытых накладных" : "fulfilled waybills"}
            </span>
          </div>
          <div className="rounded-xl glass-card-subtle p-3 text-xs transition-colors">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{language === "ru" ? "Комиссия за транш:" : "Tranche Gas Fee:"}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
              {language === "ru" ? "0% (Оплачивает смарт-контракт)" : "0% (Covered by contract)"}
            </span>
          </div>
        </div>
      </div>

      {/* Реестр счетов и закрывающих документов */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">
              {language === "ru" ? "Реестр инвойсов и прямых выплат" : "Invoice Registry & Direct Payouts"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "ru" ? "Счета, выставленные по целевым благотворительным кампаниям" : "Invoices billed under target humanitarian campaigns"}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {language === "ru" ? "Счетов:" : "Invoices:"} {currentVendor.invoices.length}
          </span>
        </div>

        {currentVendor.invoices.length === 0 ? (
          <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0e131f]/50 p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            {language === "ru" ? "У выбранного поставщика пока нет активных инвойсов." : "No active invoices for selected supplier."}
          </div>
        ) : (
          <div className="space-y-3">
            {currentVendor.invoices.map((inv) => {
              const isProcessing = isWriting && processingInvoiceId === inv.id;

              return (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl glass-card-subtle p-5 hover:bg-white/80 dark:hover:bg-white/[0.06] transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {language === "ru" ? `Счёт #${inv.invoiceNumber}` : `Invoice #${inv.invoiceNumber}`}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {language === "ru" ? `от ${inv.date}` : `dated ${inv.date}`}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-mono ${
                          inv.status === "paid"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30"
                        }`}
                      >
                        {inv.status === "paid"
                          ? (language === "ru" ? "Выплачено из эскроу ✓" : "Paid from Escrow ✓")
                          : (language === "ru" ? "Одобрен оракулом" : "Oracle Approved")}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {localizeInvoiceCampaign(inv.campaignTitle, language)}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {localizeInvoiceMilestone(inv.milestoneTitle, language)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {language === "ru" ? "К выплате:" : "Amount Payable:"}
                      </span>
                      <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {inv.amountSol} SOL
                      </span>
                    </div>

                    {inv.status === "pending_verification" ? (
                      <button
                        onClick={() => handleClaimPayout(inv.id, inv.invoiceNumber, inv.amountSol)}
                        disabled={isWriting}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] px-4 py-2 text-xs font-bold active:scale-[0.98] transition shadow-sm disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{language === "ru" ? "Записываем..." : "Recording..."}</span>
                          </>
                        ) : (
                          <>
                            <Wallet className="h-3.5 w-3.5 text-white" />
                            <span>{language === "ru" ? "Получить выплату из эскроу" : "Claim Escrow Payout"}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{language === "ru" ? "Переведено на кошелёк" : "Transferred to Wallet"}</span>
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
