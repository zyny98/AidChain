"use client";

import React, { useState } from "react";
import { useAppStore, HitlItem } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useSolanaMemo } from "@/hooks/useSolanaMemo";
import { TransactionStatusToast } from "@/components/app/TransactionStatusToast";
import { useLanguage } from "@/components/providers/LanguageProvider";
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

function localizeCampaignTitle(title: string, lang: string): string {
  if (lang !== "en") return title;
  if (title.includes("детской площадки")) return "Inclusive Children's Playground Renovation";
  if (title.includes("реабилитационного центра")) return "Pediatric Rehabilitation Center Medications";
  return title;
}

function localizeMilestoneTitle(title: string, lang: string): string {
  if (lang !== "en") return title;
  if (title.includes("ортопедических корсетов")) return "Stage 2: Customized Orthopedic Braces Procurement";
  if (title.includes("резиновой крошки")) return "Stage 2: Rubber Granules & Adhesive Procurement";
  if (title.includes("бронирование партии")) return "Stage 1: Advance for Medical Batch Reservation";
  return title;
}

function localizeHitlFlag(flag: string, lang: string): string {
  if (lang !== "en") return flag;
  if (flag.includes("превышает смету на 10%")) return "Receipt total exceeds milestone budget by 10% (8.8 SOL vs 8.0 SOL)";
  if (flag.includes("Размыт фискальный штамп")) return "Blurred fiscal tax stamp in lower receipt section";
  if (flag.includes("Поставщик отсутствует в основном Whitelist")) return "Supplier absent from primary Whitelist (accreditation required)";
  return flag;
}

function localizeOcrItemName(name: string, lang: string): string {
  if (lang !== "en") return name;
  if (name.includes("Корсет ортопедический")) return "Corrective orthopedic pediatric brace size S/M";
  return name;
}

export default function AdminPage() {
  const { language, t } = useLanguage();
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
    const memoText = `[HITL OVERRIDE APPROVED] Admin approved disputed receipt ${item.fileName} (${item.claimedAmountSol} SOL) for milestone: ${item.milestoneTitle}`;
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
    const memoText = `[REPORT REJECTED] Admin rejected receipt ${selectedHitl.fileName}: "${rejectReason}"`;
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

      {/* Верхний баннер Администратора */}
      <div className="relative overflow-hidden rounded-[26px] glass-card p-6 sm:p-8 transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{language === "ru" ? "HITL Модуль: Human-in-the-Loop" : "HITL Module: Human-in-the-Loop"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
              {t("adminBannerTitle")}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {t("adminBannerDesc")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-2xl glass-card-subtle p-4 text-center transition-colors">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                {language === "ru" ? "Очередь HITL" : "HITL Queue"}
              </span>
              <div className="mt-1 font-display text-2xl font-bold text-amber-500 dark:text-amber-400">
                {pendingHitlItems.length}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {language === "ru" ? "Требуют решения" : "Action required"}
              </span>
            </div>
            <div className="rounded-2xl glass-card-subtle border border-emerald-500/20 p-4 text-center transition-colors">
              <span className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400/80 font-mono">
                {language === "ru" ? "Точность AI" : "AI Accuracy"}
              </span>
              <div className="mt-1 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                98.4%
              </div>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 block mt-0.5">
                {language === "ru" ? "Метрика модели" : "Model metric"}
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
              {language === "ru" ? "Очередь спорных чеков (HITL Арбитраж)" : "Disputed Receipts Queue (HITL Arbitration)"}
            </h2>
          </div>

          {/* Вкладки: Требуют внимания / Решенные */}
          <div className="flex items-center rounded-xl glass-card-subtle p-1 text-xs">
            <button
              onClick={() => setActiveTab("pending")}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === "pending"
                  ? "bg-white text-slate-900 font-bold border border-black/5 shadow-xs dark:bg-white/[0.1] dark:text-white dark:border-white/[0.12]"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {language === "ru" ? `К рассмотрению (${pendingHitlItems.length})` : `Pending Review (${pendingHitlItems.length})`}
            </button>
            <button
              onClick={() => setActiveTab("resolved")}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === "resolved"
                  ? "bg-white text-slate-900 font-bold border border-black/5 shadow-xs dark:bg-white/[0.1] dark:text-white dark:border-white/[0.12]"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {language === "ru" ? `История решений (${resolvedHitlItems.length})` : `Resolution History (${resolvedHitlItems.length})`}
            </button>
          </div>
        </div>

        {activeTab === "pending" ? (
          pendingHitlItems.length === 0 ? (
            <div className="rounded-2xl glass-card p-10 text-center space-y-2">
              <ShieldCheck className="h-9 w-9 text-emerald-500 dark:text-emerald-400 mx-auto opacity-70" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === "ru" ? "Очередь HITL пуста" : "HITL Queue is empty"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {language === "ru"
                  ? "Все загруженные чеки прошли автоматическую верификацию AI-оракулом с высоким показателем уверенности."
                  : "All uploaded receipts have passed automatic AI oracle verification with high confidence."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingHitlItems.map((item) => {
                const isProcessing = isWriting && processingHitlId === item.id;

                return (
                  <div
                    key={item.id}
                    className="rounded-[24px] glass-card border border-amber-500/30 p-6 space-y-5 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/[0.06]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-300 font-semibold">
                            {language === "ru"
                              ? `Confidence: ${item.confidenceScore}% (Ниже порога 80%)`
                              : `Confidence: ${item.confidenceScore}% (Below 80% threshold)`}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {item.createdAt}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mt-1">
                          {localizeCampaignTitle(item.campaignTitle, language)}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {localizeMilestoneTitle(item.milestoneTitle, language)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">
                          {language === "ru" ? "Заявлено к выплате:" : "Claimed Amount:"}
                        </span>
                        <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {item.claimedAmountSol} SOL{" "}
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                            ({language === "ru" ? "по смете:" : "budgeted:"} {item.budgetAmountSol} SOL)
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Флаги предупреждений антифрода */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] backdrop-blur-md p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{language === "ru" ? "Флаги антифрод-системы:" : "Anti-fraud system flags:"}</span>
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-200 list-disc list-inside">
                        {item.flags.map((flag, idx) => (
                          <li key={idx}>{localizeHitlFlag(flag, language)}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Распознанные позиции vs Документ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="rounded-xl glass-card-subtle p-4 space-y-2 transition-colors">
                        <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono block">
                          {language === "ru" ? "Реквизиты продавца:" : "Supplier Credentials:"}
                        </span>
                        <div className="text-slate-900 dark:text-white font-semibold">
                          {localizeVendorName(item.vendorName, language)}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 font-mono">
                          {language === "ru" ? "БИН:" : "Tax ID / BIN:"} {item.vendorBin}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 font-mono">
                          {language === "ru" ? "Файл:" : "File:"} {item.fileName}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 break-all">
                          SHA-256: {item.fileHashSha256}
                        </div>
                      </div>

                      <div className="rounded-xl glass-card-subtle p-4 space-y-2 transition-colors">
                        <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono block">
                          {language === "ru" ? "Товарные позиции в чеке:" : "Receipt Line Items:"}
                        </span>
                        {item.ocrItems.map((ocrItem, i) => (
                          <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300">
                            <span>{localizeOcrItemName(ocrItem.name, language)} ({ocrItem.qty} {language === "ru" ? "шт" : "pcs"})</span>
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
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_20px_rgba(5,150,105,0.35)] active:scale-[0.98] py-2.5 px-4 text-xs font-bold transition shadow-sm disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{language === "ru" ? "Записываем решение в блокчейн..." : "Recording decision on-chain..."}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>{language === "ru" ? "Одобрить транш вручную (Solana Memo)" : "Approve Tranche Manually (Solana Memo)"}</span>
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
                        <span>{language === "ru" ? "Отклонить отчёт" : "Reject Report"}</span>
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
                className="rounded-xl glass-card-subtle p-4 text-xs flex items-center justify-between gap-4"
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
                      {item.status === "approved"
                        ? (language === "ru" ? "Одобрено вручную" : "Manually Approved")
                        : (language === "ru" ? "Отклонено" : "Rejected")}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {localizeCampaignTitle(item.campaignTitle, language)}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {localizeMilestoneTitle(item.milestoneTitle, language)} : {language === "ru" ? "Чек:" : "Receipt:"} {item.fileName} ({item.claimedAmountSol} SOL)
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
              {t("adminWhitelistTitle")}
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {language === "ru" ? "Аккредитовано:" : "Accredited:"} {vendors.filter((v) => v.status === "whitelisted").length} / {vendors.length}
          </span>
        </div>

        <div className="rounded-[24px] glass-card p-5 overflow-x-auto transition-colors">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                <th className="pb-3 pl-2">{t("adminThCompany")}</th>
                <th className="pb-3 px-3">{t("adminThBin")}</th>
                <th className="pb-3 px-3">{t("adminThCategory")}</th>
                <th className="pb-3 px-3">{t("adminThStatus")}</th>
                <th className="pb-3 pr-2 text-right">{language === "ru" ? "Действие" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/[0.04]">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pl-2 font-medium text-slate-900 dark:text-white">
                    {localizeVendorName(vendor.name, language)}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                    {vendor.bin}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {localizeVendorCategory(vendor.category, language)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        vendor.status === "whitelisted"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-black/[0.04] dark:bg-white/[0.05] text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {vendor.status === "whitelisted"
                        ? (language === "ru" ? "Аккредитован ✓" : "Whitelisted ✓")
                        : (language === "ru" ? "На проверке" : "Pending Review")}
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
                      {vendor.status === "whitelisted"
                        ? (language === "ru" ? "Исключить" : "Revoke")
                        : (language === "ru" ? "Аккредитовать" : "Accredit")}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-[28px] glass-window p-6 shadow-2xl transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display mb-2">
              {language === "ru" ? "Отклонение отчёта по чеку" : "Reject Receipt Report"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {language === "ru"
                ? "Укажите причину отклонения для фиксации в блокчейне и запуска возврата донорам:"
                : "Specify rejection reason to record on blockchain and trigger donor refund:"}
            </p>

            <form onSubmit={handleRejectHitlSubmit} className="space-y-4">
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={
                  language === "ru"
                    ? "Например: Несоответствие товарных позиций смете, нечитаемый QR-код ОФД..."
                    : "e.g., Line item budget discrepancy, unreadable fiscal QR code..."
                }
                className="w-full rounded-xl border border-black/15 dark:border-white/[0.12] bg-white/80 dark:bg-black/30 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none transition-colors"
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
                      <span>{language === "ru" ? "Записываем отказ..." : "Recording rejection..."}</span>
                    </>
                  ) : (
                    <span>{language === "ru" ? "Зафиксировать отказ в блокчейне" : "Record Rejection On-Chain"}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="rounded-xl border border-black/10 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white transition"
                >
                  {language === "ru" ? "Отмена" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
