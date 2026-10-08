"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAppStore, Campaign } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useSolanaMemo } from "@/hooks/useSolanaMemo";
import { TransactionStatusToast } from "@/components/app/TransactionStatusToast";
import {
  Wallet,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  Copy,
  Check,
  Search,
  ArrowRight,
  TrendingUp,
  FileText,
  Lock,
} from "lucide-react";

function formatHumanDate(dateStr: string): string {
  if (!dateStr) return "";
  const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
  if (match) {
    const [, year, month, day, time] = match;
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${parseInt(day, 10)} ${monthName} ${year}, ${time}`;
  }
  return dateStr;
}

export default function DonorDashboardPage() {
  const { campaigns, donations, addDonation, requestRefund, resetToDefaults } = useAppStore();
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

  // Вкладки Executions из референса: 'workflows' | 'permissions' | 'executions'
  const [activeTab, setActiveTab] = useState<"workflows" | "permissions" | "executions">("workflows");
  const [searchQuery, setSearchQuery] = useState("");

  // Модалка пожертвования
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [donateAmount, setDonateAmount] = useState<number>(0.5);
  const [customAmount, setCustomAmount] = useState<string>("");

  // Независимое открытие описаний фондов
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [refundingDonationId, setRefundingDonationId] = useState<string | null>(null);

  // Суммарная статистика
  const totalDonatedSol = donations.reduce((acc, d) => acc + d.amountSol, 0);
  const activeProtectedSol = donations
    .filter((d) => d.status === "escrowed")
    .reduce((acc, d) => acc + d.amountSol, 0);

  const toggleCampaignExpanded = (campaignId: string) => {
    setExpandedCampaigns((prev) => ({
      ...prev,
      [campaignId]: !prev[campaignId],
    }));
  };

  const handleOpenDonateModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDonateAmount(0.5);
    setCustomAmount("");
  };

  const handleConfirmDonation = async () => {
    if (!selectedCampaign) return;

    const amount = customAmount ? parseFloat(customAmount) : donateAmount;
    if (isNaN(amount) || amount <= 0) return;

    if (!isConnected) {
      const connected = await connect();
      if (!connected) return;
    }

    const memoText = `[AIDCHAIN DONATION] ${amount} SOL -> Кампания: ${selectedCampaign.title}`;
    const result = await writeMemo(provider, memoText);

    if (result) {
      addDonation(selectedCampaign.id, amount, result.signature, result.explorerUrl);
      setSelectedCampaign(null);
    }
  };

  const handleDonationRefund = async (donationId: string, campaignId: string, amountSol: number) => {
    if (!isConnected) {
      const connected = await connect();
      if (!connected) return;
    }

    setRefundingDonationId(donationId);
    const memoText = `[AIDCHAIN REFUND] Возврат неиспользованных средств ${amountSol} SOL по отклонённому этапу`;
    const result = await writeMemo(provider, memoText);

    if (result) {
      requestRefund(donationId, campaignId, amountSol, result.signature, result.explorerUrl);
    }
    setRefundingDonationId(null);
  };

  const currentDonateValue = customAmount ? parseFloat(customAmount) || 0 : donateAmount;

  // Фильтрация кампаний по поисковому запросу
  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-7 font-sans">
      {/* Тост статуса транзакции */}
      <TransactionStatusToast
        status={txStatus}
        statusMessage={statusMessage}
        signature={lastSignature}
        explorerUrl={lastExplorerUrl}
        error={txError}
        onClose={resetStatus}
      />

      {/* ─── 1. Сигнатурная карточка Executions в точности как на референсе ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Карточка 1: Точно как в референсе (Executions 340 ↑204% + See Report →) */}
        <div className="relative overflow-hidden rounded-[22px] border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col justify-between transition-all">
          <div>
            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 block font-sans">
              Executions
            </span>

            <div className="flex items-center gap-3 my-2">
              <span className="text-4xl sm:text-5xl font-light tracking-tight text-slate-800 dark:text-white font-sans">
                340
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>↑ 204%</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("executions")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5 transition-all pt-2 cursor-pointer w-fit"
          >
            <span>See Report</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Карточка 2: Защищено в смарт-контракте эскроу */}
        <div className="relative overflow-hidden rounded-[22px] border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 font-sans">
                Защищено в эскроу
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.2 text-[10px] font-mono text-blue-600 dark:text-blue-300">
                <Lock className="h-2.5 w-2.5" />
                Non-custodial
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl sm:text-4xl font-light tracking-tight text-slate-800 dark:text-white font-mono">
                {activeProtectedSol > 0 ? `${activeProtectedSol.toFixed(2)}` : "10.00"}
              </span>
              <span className="text-sm font-mono text-slate-500">SOL Devnet</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-slate-500">Возврат при отказе AI</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Гарантия</span>
          </div>
        </div>

        {/* Карточка 3: Мои взносы & Solana статус */}
        <div className="relative overflow-hidden rounded-[22px] border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col justify-between transition-all">
          <div>
            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 block font-sans">
              Мои пожертвования
            </span>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                {totalDonatedSol > 0 ? `${totalDonatedSol.toFixed(2)}` : "0.00"}
              </span>
              <span className="text-sm font-mono text-slate-500">SOL</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-slate-500">Статус сети:</span>
            <span className="inline-flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Devnet Verified
            </span>
          </div>
        </div>
      </section>

      {/* ─── 2. Секция Executions с табами из референса ─── */}
      <section className="space-y-4">
        {/* Заголовок блока: Executions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white font-sans tracking-tight">
              Executions
            </h2>
          </div>

          {/* Табы Workflows | Permissions | Executions + Search pill */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Набор вкладок */}
            <div className="inline-flex items-center gap-1 border-b border-slate-200/80 dark:border-white/10 pb-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("workflows")}
                className={`relative px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "workflows"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Workflows
                {activeTab === "workflows" && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 dark:bg-white rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("permissions")}
                className={`relative px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "permissions"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Permissions
                {activeTab === "permissions" && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 dark:bg-white rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("executions")}
                className={`relative px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "executions"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Executions
                {activeTab === "executions" && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 dark:bg-white rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
              </button>
            </div>

            {/* Капсульный инпут поиска из референса */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-48 sm:w-56 rounded-full bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 pl-8 pr-3 py-1 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition"
              />
            </div>
          </div>
        </div>

        {/* ─── Вкладка 1: Workflows (Целевые сборы и активные взносы) ─── */}
        {activeTab === "workflows" && (
          <div className="space-y-6 pt-1">
            {/* Мои активные пожертвования */}
            {donations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 font-mono">
                    Мои взносы в смарт-контракте ({donations.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {donations.map((don) => {
                    const matchedCamp = campaigns.find((c) => c.id === don.campaignId);
                    const hasRejectedMilestone = matchedCamp?.milestones.some((m) => m.status === "rejected");

                    return (
                      <div
                        key={don.id}
                        className="rounded-2xl border border-white/80 dark:border-white/10 bg-white/75 dark:bg-white/[0.03] p-4 shadow-sm space-y-3 backdrop-blur-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              {formatHumanDate(don.timestamp)}
                            </span>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                              {don.campaignTitle}
                            </h4>
                          </div>
                          <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {don.amountSol.toFixed(2)} SOL
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/5">
                          <span className="text-slate-500">Статус:</span>
                          {don.status === "refunded" ? (
                            <span className="font-semibold text-rose-500 flex items-center gap-1">
                              <RotateCcw className="h-3 w-3" /> Возвращено
                            </span>
                          ) : hasRejectedMilestone ? (
                            <button
                              onClick={() => handleDonationRefund(don.id, don.campaignId, don.amountSol)}
                              disabled={isWriting || refundingDonationId === don.id}
                              className="font-semibold text-amber-600 hover:underline"
                            >
                              Запросить возврат SOL →
                            </button>
                          ) : (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Заблокировано в эскроу
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Список целевых сборов */}
            <div className="space-y-4">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 font-mono block">
                Целевые благотворительные сборы ({filteredCampaigns.length})
              </span>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredCampaigns.map((camp) => {
                  const percentCollected = Math.min(
                    100,
                    Math.round((camp.collectedAmountSol / camp.targetAmountSol) * 100)
                  );
                  const isExpanded = !!expandedCampaigns[camp.id];

                  return (
                    <div
                      key={camp.id}
                      className="rounded-[22px] border border-white/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl p-5 shadow-sm space-y-4 transition-all"
                    >
                      {/* Шапка карточки кампании */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-block rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 px-2.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                            {camp.category}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                            {camp.title}
                          </h3>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {camp.collectedAmountSol} / {camp.targetAmountSol} SOL
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {percentCollected}% собрано
                          </span>
                        </div>
                      </div>

                      {/* Прогресс-бар сбора */}
                      <div className="space-y-1.5">
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${percentCollected}%` }}
                          />
                        </div>
                      </div>

                      {/* Этапы и транши */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>График траншей (Non-custodial эскроу):</span>
                          <span>{camp.milestones.length} этапа</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          {camp.milestones.map((m) => (
                            <div
                              key={m.id}
                              className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2 text-center"
                            >
                              <span className="font-mono text-slate-500 block text-[10px]">
                                Этап #{m.order}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-white block truncate">
                                {m.amountSol} SOL
                              </span>
                              <span
                                className={`text-[9.5px] font-mono block mt-0.5 ${
                                  m.status === "approved"
                                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                    : m.status === "rejected"
                                    ? "text-rose-500 font-bold"
                                    : "text-slate-400"
                                }`}
                              >
                                {m.status === "approved"
                                  ? "Выплачен"
                                  : m.status === "rejected"
                                  ? "Отклонён"
                                  : "Ожидает"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Кнопка пожертвования и спойлер описания */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleOpenDonateModal(camp)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 py-2.5 px-4 text-xs font-bold transition shadow-sm active:scale-[0.98]"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                          <span>Пожертвовать в эскроу</span>
                        </button>

                        <button
                          onClick={() => toggleCampaignExpanded(camp.id)}
                          className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                          title="Подробнее о сборе"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Раскрытое описание */}
                      {isExpanded && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <p>{camp.description}</p>
                          <div className="mt-2 text-[11px] font-mono text-slate-400">
                            Организатор: {camp.organizer} ({camp.organizerAddress})
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Вкладка 2: Permissions (Архитектура эскроу и верификации) ─── */}
        {activeTab === "permissions" && (
          <div className="rounded-[22px] border border-white/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Архитектура прав и смарт-контракта (Non-Custodial Escrow)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Прямые криптографические гарантии исполнения в блокчейне Solana Devnet
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-4 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-white block">
                  1. Роль Донора (Non-custodial)
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Средства блокируются напрямую в смарт-контракте эскроу. Фонд не имеет доступа к телу депозита до предоставления чека.
                </p>
                <span className="text-[10px] font-mono text-emerald-600 font-bold block pt-1">
                  Право: Запрос 100% возврата при браке
                </span>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-4 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-white block">
                  2. AI-Оракул (OCR + SHA-256)
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Оракул автоматически сверяет распознанные позиции чека со сметой и проверяет валидность БИН поставщика.
                </p>
                <span className="text-[10px] font-mono text-blue-600 font-bold block pt-1">
                  Право: Авто-разблокировка транша (&gt;80%)
                </span>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-4 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-white block">
                  3. Multi-Sig HITL Арбитраж
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Спорные чеки с сомнительным качеством направляются на ручной аудит администратора с фиксацией вердикта в SPL Memo.
                </p>
                <span className="text-[10px] font-mono text-amber-600 font-bold block pt-1">
                  Право: Запись подтверждения/отказа
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Вкладка 3: Executions ─── */}
        {activeTab === "executions" && (
          <div className="rounded-[22px] border border-white/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Исполнение и реестр транзакций
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Все подтвержденные транзакции смарт-контракта эскроу перенесены в единый раздел блокчейн-истории
                </p>
              </div>
              <Link
                href="/app/history"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-2 text-xs font-semibold shadow-sm hover:opacity-90 transition active:scale-95"
              >
                <span>Перейти в Историю транзакций</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ─── Модалка внесения пожертвования в эскроу ─── */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[28px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1422] p-6 shadow-2xl backdrop-blur-2xl transition-colors">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">
                  Взнос в смарт-контракт
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans mt-0.5">
                  {selectedCampaign.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Пресеты сумм */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Выберите сумму взноса (SOL):
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0.1, 0.5, 1.0, 2.5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setDonateAmount(val);
                        setCustomAmount("");
                      }}
                      className={`rounded-xl py-2 text-xs font-mono font-semibold transition ${
                        donateAmount === val && !customAmount
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                          : "border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {val} SOL
                    </button>
                  ))}
                </div>
              </div>

              {/* Произвольная сумма */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Или укажите свою сумму:
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Гарантия эскроу */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Гарантия эскроу:</span>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  Средства будут переведены поставщику траншами только после валидации чеков AI-оракулом. В случае отказа вы сможете вернуть взнос.
                </p>
              </div>

              {/* Кнопки */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={handleConfirmDonation}
                  disabled={isWriting || currentDonateValue <= 0}
                  className="flex-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 py-2.5 px-4 text-xs font-bold transition shadow-sm disabled:opacity-50 active:scale-[0.98]"
                >
                  {isWriting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Подписание...
                    </span>
                  ) : (
                    `Внести ${currentDonateValue} SOL`
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
