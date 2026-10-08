"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAppStore, Campaign } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useSolanaMemo } from "@/hooks/useSolanaMemo";
import { TransactionStatusToast } from "@/components/app/TransactionStatusToast";
import { useLanguage } from "@/components/providers/LanguageProvider";
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

function formatHumanDate(dateStr: string, lang: string): string {
  if (!dateStr) return "";
  const monthsRu = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
  if (match) {
    const [, year, month, day, time] = match;
    const mIdx = parseInt(month, 10) - 1;
    const mName = lang === "en" ? (monthsEn[mIdx] || month) : (monthsRu[mIdx] || month);
    return lang === "en" ? `${mName} ${parseInt(day, 10)}, ${year}, ${time}` : `${parseInt(day, 10)} ${mName} ${year}, ${time}`;
  }
  return dateStr;
}

function localizeCampaignTitle(title: string, lang: string): string {
  if (lang !== "en") return title;
  if (title.includes("детской площадки")) return "Inclusive Children's Playground Renovation";
  if (title.includes("реабилитационного центра")) return "Pediatric Rehabilitation Center Medications";
  return title;
}

function localizeCategory(cat: string, lang: string): string {
  if (lang !== "en") return cat;
  if (cat.includes("Инклюзия")) return "Urban Space & Inclusion";
  if (cat.includes("Здравоохранение")) return "Healthcare & Meds";
  if (cat.includes("Гуманитарная")) return "Humanitarian Aid";
  return cat;
}

function localizeDescription(desc: string, lang: string): string {
  if (lang !== "en") return desc;
  if (desc.includes("резинового покрытия")) {
    return "Installation of certified shock-absorbing rubber flooring, tactile tiles, and wheelchair-accessible swings for children with special needs in Almaty.";
  }
  if (desc.includes("ортопедических корсетов")) {
    return "Urgent procurement of specialized orthopedic braces and clinical consumables for 40 pediatric patients in Astana rehabilitation center.";
  }
  return desc;
}

function localizeMilestoneTitle(title: string, lang: string): string {
  if (lang !== "en") return title;
  if (title.includes("Аванс 20%: проектирование")) return "Advance 20%: Design & Permits";
  if (title.includes("резиновой крошки")) return "Tranche 1 (40%): Rubber Granules & Adhesive";
  if (title.includes("игровых модулей")) return "Tranche 2 (40%): Play Modules & Mounting";
  if (title.includes("бронирование партии")) return "Advance 20%: Medical Batch Reservation";
  if (title.includes("ортопедических корсетов")) return "Tranche 1 (40%): Orthopedic Braces (Disputed)";
  if (title.includes("физиотерапии")) return "Tranche 2 (40%): Physiotherapy Consumables";
  return title;
}

export default function DonorDashboardPage() {
  const { language, t } = useLanguage();
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

  // Вкладки: 'workflows' | 'permissions' | 'executions'
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

    const memoText = `[AIDCHAIN DONATION] ${amount} SOL -> Campaign: ${selectedCampaign.title}`;
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
    const memoText = `[AIDCHAIN REFUND] Return of unspent ${amountSol} SOL on disputed milestone`;
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
        {/* Карточка 1: Проверок AI-Оракулом */}
        <div className="glass-card relative overflow-hidden rounded-[26px] p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]">
          <div>
            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 block font-sans">
              {language === "ru" ? "Проверок AI-Оракулом" : "AI Oracle Verifications"}
            </span>

            <div className="flex items-center gap-3 my-2.5">
              <span className="text-4xl sm:text-5xl font-light tracking-tight text-slate-800 dark:text-white font-sans">
                340
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>{language === "ru" ? "94.8% точность" : "94.8% accuracy"}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("executions")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5 transition-all pt-2 cursor-pointer w-fit"
          >
            <span>{language === "ru" ? "Смотреть отчёт" : "View report"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Карточка 2: Защищено в смарт-контракте эскроу */}
        <div className="glass-card relative overflow-hidden rounded-[26px] p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]">
          <div>
            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 block font-sans">
              {language === "ru" ? "Защищено в эскроу" : "Locked in Escrow"}
            </span>

            <div className="flex items-baseline gap-2 my-2.5">
              <span className="text-3xl sm:text-4xl font-light tracking-tight text-slate-800 dark:text-white font-mono">
                {activeProtectedSol > 0 ? `${activeProtectedSol.toFixed(2)}` : "10.00"}
              </span>
              <span className="text-sm font-mono text-slate-500">SOL</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {language === "ru" ? "Возврат при отказе AI" : "Refund on AI rejection"}
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {language === "ru" ? "100% Гарантия" : "100% Guarantee"}
            </span>
          </div>
        </div>

        {/* Карточка 3: Мои взносы & Solana статус */}
        <div className="glass-card relative overflow-hidden rounded-[26px] p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]">
          <div>
            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 block font-sans">
              {t("donorStat1Title")}
            </span>

            <div className="flex items-baseline gap-2 my-2.5">
              <span className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                {totalDonatedSol > 0 ? `${totalDonatedSol.toFixed(2)}` : "0.00"}
              </span>
              <span className="text-sm font-mono text-slate-500">SOL</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {language === "ru" ? "Статус сети:" : "Network status:"}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {language === "ru" ? "Подтверждено в сети" : "Confirmed on-chain"}
            </span>
          </div>
        </div>
      </section>

      {/* ─── 2. Секция Целевые сборы с табами ─── */}
      <section className="space-y-4">
        {/* Заголовок блока: Целевые сборы */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white font-sans tracking-tight">
              {language === "ru" ? "Целевые сборы" : "Target Aid Campaigns"}
            </h2>
          </div>

          {/* Табы Кампании | Правила эскроу | Аудит транзакций + Поиск */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Набор вкладок */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-white/65 dark:border-white/10 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab("workflows")}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "workflows"
                    ? "bg-white/90 dark:bg-white/15 text-slate-900 dark:text-white shadow-sm border border-white/80 dark:border-white/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {language === "ru" ? "Кампании" : "Campaigns"}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("permissions")}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "permissions"
                    ? "bg-white/90 dark:bg-white/15 text-slate-900 dark:text-white shadow-sm border border-white/80 dark:border-white/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {language === "ru" ? "Правила эскроу" : "Escrow Rules"}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("executions")}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "executions"
                    ? "bg-white/90 dark:bg-white/15 text-slate-900 dark:text-white shadow-sm border border-white/80 dark:border-white/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {language === "ru" ? "Аудит транзакций" : "Audit Trail"}
              </button>
            </div>

            {/* Капсульный инпут поиска */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("donorSearchPlaceholder")}
                className="w-48 sm:w-56 rounded-full bg-white/55 dark:bg-white/[0.04] backdrop-blur-xl border border-white/70 dark:border-white/10 pl-8 pr-3.5 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
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
                    {language === "ru"
                      ? `Мои взносы в смарт-контракте (${donations.length})`
                      : `My Smart Contract Deposits (${donations.length})`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {donations.map((don) => {
                    const matchedCamp = campaigns.find((c) => c.id === don.campaignId);
                    const hasRejectedMilestone = matchedCamp?.milestones.some((m) => m.status === "rejected");

                    return (
                      <div
                        key={don.id}
                        className="glass-card relative overflow-hidden rounded-[24px] p-5 shadow-sm space-y-3 transition-all hover:scale-[1.005]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              {formatHumanDate(don.timestamp, language)}
                            </span>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                              {localizeCampaignTitle(don.campaignTitle, language)}
                            </h4>
                          </div>
                          <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {don.amountSol.toFixed(2)} SOL
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/60 dark:border-white/5">
                          <span className="text-slate-500">
                            {language === "ru" ? "Статус:" : "Status:"}
                          </span>
                          {don.status === "refunded" ? (
                            <span className="font-semibold text-rose-500 flex items-center gap-1">
                              <RotateCcw className="h-3 w-3" /> {language === "ru" ? "Возвращено" : "Refunded"}
                            </span>
                          ) : hasRejectedMilestone ? (
                            <button
                              onClick={() => handleDonationRefund(don.id, don.campaignId, don.amountSol)}
                              disabled={isWriting || refundingDonationId === don.id}
                              className="font-semibold text-amber-600 hover:underline"
                            >
                              {language === "ru" ? "Запросить возврат SOL →" : "Request SOL Refund →"}
                            </button>
                          ) : (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                              {language === "ru" ? "Заблокировано в эскроу" : "Locked in Escrow"}
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
                {language === "ru"
                  ? `Целевые благотворительные сборы (${filteredCampaigns.length})`
                  : `Target Humanitarian Campaigns (${filteredCampaigns.length})`}
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
                      className="glass-card relative overflow-hidden rounded-[28px] p-6 space-y-4 transition-all hover:scale-[1.005]"
                    >
                      {/* Шапка карточки кампании */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            {localizeCategory(camp.category, language)}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                            {localizeCampaignTitle(camp.title, language)}
                          </h3>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {camp.collectedAmountSol} / {camp.targetAmountSol} SOL
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {percentCollected}% {language === "ru" ? "собрано" : "raised"}
                          </span>
                        </div>
                      </div>

                      {/* Прогресс-бар сбора */}
                      <div className="space-y-1.5">
                        <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${percentCollected}%` }}
                          />
                        </div>
                      </div>

                      {/* Этапы и транши */}
                      <div className="space-y-2 pt-2 border-t border-white/60 dark:border-white/5">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            {language === "ru"
                              ? "График траншей смарт-контракта эскроу:"
                              : "Escrow tranche schedule:"}
                          </span>
                          <span>
                            {camp.milestones.length} {language === "ru" ? "этапа" : "stages"}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          {camp.milestones.map((m) => (
                            <div
                              key={m.id}
                              className="glass-card-subtle rounded-2xl p-2.5 text-center transition-all"
                            >
                              <span className="font-mono text-slate-500 block text-[10px]">
                                {language === "ru" ? `Этап #${m.order}` : `Stage #${m.order}`}
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
                                  ? (language === "ru" ? "Выплачен" : "Released")
                                  : m.status === "rejected"
                                  ? (language === "ru" ? "Отклонён" : "Rejected")
                                  : (language === "ru" ? "Ожидает" : "Pending")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Кнопка пожертвования и спойлер описания */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleOpenDonateModal(camp)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white dark:shadow-[0_0_20px_rgba(37,99,235,0.35)] py-2.5 px-4 text-xs font-bold transition shadow-sm active:scale-[0.98]"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                          <span>{t("donorDonateBtn")}</span>
                        </button>

                        <button
                          onClick={() => toggleCampaignExpanded(camp.id)}
                          className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                          title={language === "ru" ? "Подробнее о сборе" : "Campaign details"}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Раскрытое описание */}
                      {isExpanded && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <p>{localizeDescription(camp.description, language)}</p>
                          <div className="mt-2 text-[11px] font-mono text-slate-400">
                            {language === "ru" ? "Организатор:" : "Organizer:"} {camp.organizer} ({camp.organizerAddress})
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
          <div className="glass-card relative overflow-hidden rounded-[28px] p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === "ru"
                  ? "Архитектура прав и смарт-контракта (Non-Custodial Escrow)"
                  : "Access Architecture & Smart Contract (Non-Custodial Escrow)"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "ru"
                  ? "Прямые криптографические гарантии исполнения в блокчейне Solana Network"
                  : "Direct cryptographic execution guarantees on Solana Network"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="glass-card-subtle rounded-2xl p-4.5 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-white block">
                  {language === "ru" ? "1. Роль Донора (Non-custodial)" : "1. Donor Role (Non-custodial)"}
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {language === "ru"
                    ? "Средства блокируются напрямую в смарт-контракте эскроу. Фонд не имеет доступа к телу депозита до предоставления чека."
                    : "Funds are locked directly in the smart contract escrow. The foundation has no access to the deposit balance prior to receipt validation."}
                </p>
                <span className="text-[10px] font-mono text-emerald-600 font-bold block pt-1">
                  {language === "ru" ? "Право: Запрос 100% возврата при браке" : "Permission: 100% refund request on failure"}
                </span>
              </div>

              <div className="glass-card-subtle rounded-2xl p-4.5 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-white block">
                  {language === "ru" ? "2. AI-Оракул (OCR + SHA-256)" : "2. AI Oracle (OCR + SHA-256)"}
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {language === "ru"
                    ? "Оракул автоматически сверяет распознанные позиции чека со сметой и проверяет валидность БИН поставщика."
                    : "The oracle automatically matches OCR receipt lines against itemized budget and validates vendor Tax ID."}
                </p>
                <span className="text-[10px] font-mono text-blue-600 font-bold block pt-1">
                  {language === "ru" ? "Право: Авто-разблокировка транша (>80%)" : "Permission: Auto-unlock tranche (>80%)"}
                </span>
              </div>

              <div className="glass-card-subtle rounded-2xl p-4.5 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-white block">
                  {language === "ru" ? "3. Multi-Sig HITL Арбитраж" : "3. Multi-Sig HITL Arbitration"}
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {language === "ru"
                    ? "Спорные чеки с сомнительным качеством направляются на ручной аудит администратора с фиксацией вердикта в SPL Memo."
                    : "Disputed receipts with questionable quality are forwarded to human administrator audit with verdicts recorded in SPL Memo."}
                </p>
                <span className="text-[10px] font-mono text-amber-600 font-bold block pt-1">
                  {language === "ru" ? "Право: Запись подтверждения/отказа" : "Permission: Record approval/rejection"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Вкладка 3: Executions ─── */}
        {activeTab === "executions" && (
          <div className="glass-card relative overflow-hidden rounded-[28px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === "ru" ? "Исполнение и реестр транзакций" : "Tranche Execution & Transaction Ledger"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === "ru"
                    ? "Все подтвержденные транзакции смарт-контракта эскроу перенесены в единый раздел блокчейн-истории"
                    : "All verified escrow smart contract transactions are recorded in the unified blockchain history."}
                </p>
              </div>
              <Link
                href="/app/history"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <span>{language === "ru" ? "Перейти в Историю транзакций" : "Go to Transaction History"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ─── Модалка внесения пожертвования в эскроу ─── */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[32px] border border-white/80 dark:border-white/15 bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-3xl p-7 shadow-2xl transition-colors">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">
                  {language === "ru" ? "Взнос в смарт-контракт" : "Smart Contract Deposit"}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans mt-0.5">
                  {localizeCampaignTitle(selectedCampaign.title, language)}
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
                  {language === "ru" ? "Выберите сумму взноса (SOL):" : "Select donation amount (SOL):"}
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
                          ? "bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white"
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
                  {language === "ru" ? "Или укажите свою сумму:" : "Or specify custom amount:"}
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
                <span className="font-semibold">{language === "ru" ? "Гарантия эскроу:" : "Escrow Guarantee:"}</span>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  {language === "ru"
                    ? "Средства будут переведены поставщику траншами только после валидации чеков AI-оракулом. В случае отказа вы сможете вернуть взнос."
                    : "Funds will be transferred to suppliers strictly after fiscal receipt verification by AI oracle. In case of rejection, you can claim a refund."}
                </p>
              </div>

              {/* Кнопки */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={handleConfirmDonation}
                  disabled={isWriting || currentDonateValue <= 0}
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white dark:shadow-[0_0_20px_rgba(37,99,235,0.35)] py-2.5 px-4 text-xs font-bold transition shadow-sm disabled:opacity-50 active:scale-[0.98]"
                >
                  {isWriting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {language === "ru" ? "Подписание..." : "Signing..."}
                    </span>
                  ) : (
                    language === "ru" ? `Внести ${currentDonateValue} SOL` : `Lock ${currentDonateValue} SOL in Escrow`
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                >
                  {language === "ru" ? "Отмена" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
