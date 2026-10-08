"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, Campaign } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useSolanaMemo } from "@/hooks/useSolanaMemo";
import { TransactionStatusToast } from "@/components/app/TransactionStatusToast";
import { AuditTrailTable } from "@/components/app/AuditTrailTable";
import {
  Heart,
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

export default function DonorPage() {
  const { campaigns, donations, addDonation, requestRefund } = useAppStore();
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

  // Модалка пожертвования
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [donateAmount, setDonateAmount] = useState<number>(0.5);
  const [customAmount, setCustomAmount] = useState<string>("");

  // Независимое открытие описаний фондов: Record<string, boolean>
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});

  // Спойлер для технических деталей / аудита (скрыт по умолчанию, чтобы не перегружать новичка)
  const [showTechnicalAudit, setShowTechnicalAudit] = useState<boolean>(false);

  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [refundingDonationId, setRefundingDonationId] = useState<string | null>(null);

  // Суммарная статистика
  const totalDonatedSol = donations.reduce((acc, d) => acc + d.amountSol, 0);
  const activeProtectedSol = donations
    .filter((d) => d.status === "escrowed")
    .reduce((acc, d) => acc + d.amountSol, 0);

  // Переключение описания конкретного фонда (не закрывает другие!)
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

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const currentDonateValue = customAmount ? parseFloat(customAmount) || 0 : donateAmount;

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Тост статуса транзакции */}
      <TransactionStatusToast
        status={txStatus}
        statusMessage={statusMessage}
        signature={lastSignature}
        explorerUrl={lastExplorerUrl}
        error={txError}
        onClose={resetStatus}
      />

      {/* Верхний баннер: простой, интуитивный, сплошной темный блок без градиентов */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#121827] p-5 sm:p-7 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Смарт-контракт эскроу</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-[0.005em]">
                Кабинет Донора
              </h1>
              {!isConnected && (
                <span className="rounded-md border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-[11px] font-sans font-medium text-slate-400">
                  Демо-данные
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              Ваши взносы хранятся в смарт-контракте. Деньги выплачиваются поставщику траншами только после проверки чека оракулом.
            </p>
          </div>

          {/* 2 понятные метрики (дублирующая карточка убрана, подписи WCAG AA) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 sm:min-w-[340px]">
            <div className="rounded-xl border border-white/[0.08] bg-[#090d16] p-4 text-center flex flex-col justify-between">
              <span className="text-[13px] font-sans font-medium text-slate-300">
                Пожертвовано
              </span>
              <div className="my-1 font-mono text-xl sm:text-2xl font-bold text-white">
                {totalDonatedSol > 0 ? `${totalDonatedSol.toFixed(2)} SOL` : "0.00 SOL"}
              </div>
              <span className="text-xs text-slate-400 block font-sans">
                ≈ ${(totalDonatedSol * 150).toFixed(2)} USD · Возврат доступен
              </span>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#090d16] p-4 text-center flex flex-col justify-between">
              <span className="text-[13px] font-sans font-medium text-slate-300">
                Статус защиты
              </span>
              <div className="my-1 inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Активен</span>
              </div>
              <span className="text-xs text-slate-400 block font-sans">
                Эскроу-протокол включён
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Секция 1: Мои пожертвования */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-[0.005em]">
              Мои пожертвования
            </h2>
            {!isConnected && (
              <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-sans font-medium text-slate-400">
                Демо
              </span>
            )}
          </div>
        </div>

        {donations.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#121827] p-8 text-center space-y-2">
            <p className="text-sm text-slate-300 font-medium">
              Вы пока не делали пожертвований.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Выберите любой сбор ниже и внесите тестовый взнос в сеть Solana Devnet, чтобы увидеть работу защитного смарт-контракта.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donations.map((don) => {
              const matchedCamp = campaigns.find((c) => c.id === don.campaignId);
              const hasRejectedMilestone = matchedCamp?.milestones.some(
                (m) => m.status === "rejected"
              );

              return (
                <div
                  key={don.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#121827] p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-sans text-slate-400 block">
                        {formatHumanDate(don.timestamp)}
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-1">
                        {don.campaignTitle}
                      </h4>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-base font-bold text-emerald-400">
                        {don.amountSol.toFixed(2)} SOL
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        ≈ ${(don.amountSol * 150).toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  {/* Статус взноса в смарт-контракте */}
                  <div className="rounded-xl border border-white/[0.06] bg-[#090d16] p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Статус средств:</span>
                    {don.status === "refunded" ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Возвращено донору
                      </span>
                    ) : hasRejectedMilestone ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-400 animate-pulse">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Спорный этап (Доступен возврат)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Заблокировано в эскроу (100%)
                      </span>
                    )}
                  </div>

                  {/* Ссылка в блокчейн и кнопка возврата (кликабельная строка, крупный текст, focus) */}
                  <div className="space-y-2 pt-1">
                    <a
                      href={
                        don.signature
                          ? (don.explorerUrl || `https://explorer.solana.com/tx/${don.signature}?cluster=devnet`)
                          : `https://explorer.solana.com/address/MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr?cluster=devnet`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs sm:text-[13px] text-sky-400 hover:text-sky-300 hover:bg-white/[0.06] hover:border-sky-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    >
                      <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                        Запись в Solana Explorer
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sky-400 group-hover:text-sky-300 font-medium font-mono">
                        {don.signature ? "Посмотреть транзакцию" : "Проверить в Devnet"}
                        <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </a>

                    {hasRejectedMilestone && don.status !== "refunded" && (
                      <button
                        onClick={() => handleDonationRefund(don.id, don.campaignId, don.amountSol)}
                        disabled={isWriting || refundingDonationId === don.id}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 active:scale-[0.98] transition disabled:opacity-50"
                      >
                        {refundingDonationId === don.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        <span>Забрать возврат ({don.amountSol.toFixed(2)} SOL)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Секция 2: Активные целевые сборы (Фонды) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-[0.005em]">
            Активные целевые сборы фондов
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Выберите сбор. Деньги будут защищены смарт-контрактом и выплачиваться только по подтверждённым чекам.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => {
            const percent = Math.min(
              100,
              Math.round((campaign.collectedAmountSol / campaign.targetAmountSol) * 100)
            );
            // Независимое раскрытие: проверяем ключ конкретного фонда
            const isExpanded = !!expandedCampaigns[campaign.id];

            return (
              <div
                key={campaign.id}
                className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#121827] p-6 shadow-sm hover:border-white/[0.14] transition-colors"
              >
                <div>
                  {/* Заголовок и категория */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="rounded-full border border-white/[0.1] bg-[#090d16] px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                      {campaign.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>до {campaign.deadline}</span>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-white tracking-[0.005em]">
                    {campaign.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    {campaign.description}
                  </p>

                  <div className="mt-2 text-[11px] text-slate-400">
                    Организатор: <span className="text-slate-200 font-medium">{campaign.organizer}</span>
                  </div>

                  {/* Прогресс-бар сбора (сплошной зеленый, строго без градиентов) */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Собрано в эскроу:</span>
                      <span className="text-white font-semibold">
                        {campaign.collectedAmountSol.toFixed(2)} SOL /{" "}
                        <span className="text-slate-400">{campaign.targetAmountSol.toFixed(2)} SOL</span> ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#090d16]">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Независимый спойлер: Этапы и смета для конкретного фонда */}
                  <div className="mt-5 pt-4 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => toggleCampaignExpanded(campaign.id)}
                      className="flex w-full items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors py-1"
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-blue-400" />
                        <span>Этапы реализации и сметы ({campaign.milestones.length})</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>

                    {/* Содержимое раскрывается только для этого фонда с плавной анимацией */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key={`milestones-${campaign.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                            transition: {
                              height: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                              opacity: { duration: 0.22, delay: 0.05, ease: "easeOut" },
                            },
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                              height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                              opacity: { duration: 0.15, ease: "easeIn" },
                            },
                          }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2.5">
                            {campaign.milestones.map((m) => (
                              <div
                                key={m.id}
                                className="rounded-xl border border-white/[0.06] bg-[#090d16] p-3 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-slate-200">
                                    {m.order}. {m.title}
                                  </span>
                                  <span
                                    className={`rounded px-2 py-0.5 text-[10px] font-medium font-mono ${
                                      m.status === "approved"
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                        : m.status === "submitted"
                                        ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                                        : m.status === "rejected"
                                        ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                        : "bg-white/[0.05] text-slate-400"
                                    }`}
                                  >
                                    {m.status === "approved"
                                      ? "Выплачен"
                                      : m.status === "submitted"
                                      ? "Чек на проверке"
                                      : m.status === "rejected"
                                      ? "Отклонён"
                                      : "Ожидает"}
                                  </span>
                                </div>

                                <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                                  <span>Транш: {m.amountSol.toFixed(2)} SOL ({m.percent}%)</span>
                                  {m.confidenceScore && (
                                    <span className="text-slate-300 font-mono">
                                      AI Score: {m.confidenceScore}%
                                    </span>
                                  )}
                                </div>

                                {/* Позиции сметы */}
                                <div className="mt-2 pl-2 border-l border-white/[0.08] space-y-1">
                                  {m.budgetItems.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex justify-between text-[10px] text-slate-400"
                                    >
                                      <span>- {item.name} ({item.qty} {item.unit})</span>
                                      <span className="font-mono text-slate-200">
                                        {(item.qty * item.priceSol).toFixed(2)} SOL
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Кнопка пожертвования: сплошной контрастный цвет */}
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => handleOpenDonateModal(campaign)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-[0.98] py-2.5 px-4 text-xs font-bold transition shadow-sm"
                  >
                    <Heart className="h-3.5 w-3.5 fill-slate-950" />
                    <span>Пожертвовать в эскроу</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Секция 3: Технический аудит и чеки (Спойлер для разгрузки интерфейса новичка) */}
      <section className="space-y-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-[0.005em]">
            Блокчейн-аудит и проверка чеков
          </h2>
          <button
            type="button"
            onClick={() => setShowTechnicalAudit(!showTechnicalAudit)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#121827] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition"
          >
            <span>{showTechnicalAudit ? "Скрыть технические логи" : "Показать чеки и транзакции"}</span>
            {showTechnicalAudit ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Каждая выплата из смарт-контракта подтверждается фискальным чеком поставщика и записывается в сеть Solana.
        </p>

        {showTechnicalAudit && (
          <div className="space-y-6 pt-2">
            {/* Карточки чеков */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.08] bg-[#121827] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      Транш выплачен поставщику
                    </span>
                    <h4 className="text-sm font-semibold text-white mt-2">
                      Закупка резиновой крошки и связующего
                    </h4>
                    <p className="text-xs text-slate-400">
                      Поставщик: ТОО «КазПолимер Строй» (БИН 210540023412)
                    </p>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    5.95 SOL
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#090d16] p-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Фискальный чек:</span>
                    <span className="font-mono text-white">fiscal_receipt_kazpolymer_482.jpg</span>
                  </div>
                  <div className="flex justify-between text-slate-300 items-center">
                    <span className="text-slate-400">SHA-256 хэш:</span>
                    <button
                      onClick={() => copyHash("7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069")}
                      className="font-mono text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                    >
                      <span className="truncate max-w-[150px]">7f83b1657ff1...</span>
                      {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">AI Confidence:</span>
                    <span className="text-emerald-400 font-medium">96% (Сверка со сметой 100%)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#121827] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      Аванс 20% выплачен
                    </span>
                    <h4 className="text-sm font-semibold text-white mt-2">
                      Проектирование и согласование площадки
                    </h4>
                    <p className="text-xs text-slate-400">
                      Исполнитель: ТОО «Архитектурное бюро Алматы»
                    </p>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    3.00 SOL
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#090d16] p-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Документ:</span>
                    <span className="font-mono text-white">act_approval_almaty.pdf</span>
                  </div>
                  <div className="flex justify-between text-slate-300 items-center">
                    <span className="text-slate-400">SHA-256 хэш:</span>
                    <button
                      onClick={() => copyHash("a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0")}
                      className="font-mono text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                    >
                      <span className="truncate max-w-[150px]">a1b2c3d4e5f6...</span>
                      {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">AI Confidence:</span>
                    <span className="text-emerald-400 font-medium">99% (Подпись проверена)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Trail Таблица */}
            <AuditTrailTable />
          </div>
        )}
      </section>

      {/* Модалка внесения пожертвования (сплошной фон #121827 без градиентов) */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#121827] p-6 sm:p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
                  Целевой эскроу-взнос
                </span>
                <h3 className="text-lg font-semibold text-white tracking-[0.005em] mt-1">
                  {selectedCampaign.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.05] hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-[#090d16] p-4 mb-5">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-400 mb-1">
                <Info className="h-4 w-4" />
                <span>Гарантия смарт-контракта</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Деньги поступают не на личную карту, а блокируются в смарт-контракте. Средства выплачиваются только после проверки чека оракулом.
              </p>
            </div>

            {/* Выбор суммы */}
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-300">
                Выберите сумму пожертвования (SOL Devnet):
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {[0.1, 0.5, 1.0].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setDonateAmount(amt);
                      setCustomAmount("");
                    }}
                    className={`rounded-xl py-2.5 px-3 text-center font-mono text-xs font-bold transition-all active:scale-[0.98] ${
                      donateAmount === amt && !customAmount
                        ? "bg-white text-slate-950 shadow-sm"
                        : "bg-[#090d16] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08]"
                    }`}
                  >
                    {amt.toFixed(2)} SOL
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1.5 block">
                  Или укажите свою сумму:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    placeholder="Например, 0.25"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setDonateAmount(0);
                    }}
                    className="w-full rounded-xl border border-white/[0.12] bg-[#090d16] px-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                    SOL (≈ ${(currentDonateValue * 150).toFixed(2)} USD)
                  </span>
                </div>
              </div>
            </div>

            {/* Кнопка отправки транзакции */}
            <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleConfirmDonation}
                disabled={isWriting || currentDonateValue <= 0}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-[0.98] py-2.5 px-5 text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {isWriting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Записываем в блокчейн...</span>
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 fill-slate-950" />
                    <span>Внести {currentDonateValue > 0 ? currentDonateValue.toFixed(2) : "0.00"} SOL в эскроу</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="rounded-xl border border-white/[0.08] bg-[#090d16] py-2.5 px-4 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
