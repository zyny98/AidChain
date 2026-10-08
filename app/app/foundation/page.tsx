"use client";

import React, { useState } from "react";
import { useAppStore, Campaign, Milestone } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useSolanaMemo } from "@/hooks/useSolanaMemo";
import { TransactionStatusToast } from "@/components/app/TransactionStatusToast";
import {
  Building2,
  Plus,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Calendar,
  Loader2,
  Zap,
  FileText,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";

export default function FoundationPage() {
  const { campaigns, createCampaign, uploadReceipt, approveMilestone } = useAppStore();
  const { provider, isConnected, connect, formattedAddress } = usePhantomWallet();
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

  // Создание кампании
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Гуманитарная помощь");
  const [newTargetSol, setNewTargetSol] = useState("10");
  const [newDeadline, setNewDeadline] = useState("2026-12-01");

  // Загрузка чека
  const [selectedMilestone, setSelectedMilestone] = useState<{
    campaignId: string;
    milestone: Milestone;
  } | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [computedSha256, setComputedSha256] = useState("");
  const [isComputingHash, setIsComputingHash] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeProcessingMilestoneId, setActiveProcessingMilestoneId] = useState<string | null>(null);
  const [aiVerdict, setAiVerdict] = useState<{
    vendorName: string;
    vendorBin: string;
    ocrTotal: number;
    confidenceScore: number;
    flags: string[];
    isApproved: boolean;
  } | null>(null);

  // Обработка файла и вычисление SHA-256 хэша
  const processReceiptFile = async (file: File) => {
    setUploadFileName(file.name);
    setIsComputingHash(true);
    setAiVerdict(null);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setComputedSha256(hashHex);

      // Имитация AI-оракула (OCR + сверка)
      setIsAiAnalyzing(true);
      setTimeout(() => {
        setIsAiAnalyzing(false);
        setAiVerdict({
          vendorName: "ТОО «КазПолимер Строй»",
          vendorBin: "210540023412",
          ocrTotal: selectedMilestone?.milestone.amountSol || 5.95,
          confidenceScore: 96,
          flags: [],
          isApproved: true,
        });
      }, 1100);
    } catch (err) {
      console.error("SHA-256 error:", err);
    } finally {
      setIsComputingHash(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processReceiptFile(file);
    }
    e.target.value = "";
  };

  // Быстрый демо-чек в 1 клик
  const handleUseDemoReceipt = () => {
    setUploadFileName("demo_fiscal_kazpolymer_2026.jpg");
    setComputedSha256("7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069");
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiVerdict({
        vendorName: "ТОО «КазПолимер Строй»",
        vendorBin: "210540023412",
        ocrTotal: selectedMilestone?.milestone.amountSol || 5.95,
        confidenceScore: 96,
        flags: [],
        isApproved: true,
      });
    }, 800);
  };

  const handleConfirmReceipt = () => {
    if (!selectedMilestone || !aiVerdict) return;

    uploadReceipt(selectedMilestone.campaignId, selectedMilestone.milestone.id, {
      fileName: uploadFileName,
      fileHashSha256: computedSha256,
      vendorName: aiVerdict.vendorName,
      vendorBin: aiVerdict.vendorBin,
      ocrTotal: aiVerdict.ocrTotal,
      confidenceScore: aiVerdict.confidenceScore,
      flags: aiVerdict.flags,
      ocrItems: selectedMilestone.milestone.budgetItems.map((b) => ({
        name: b.name,
        qty: b.qty,
        priceSol: b.priceSol,
      })),
    });

    setSelectedMilestone(null);
    setUploadFileName("");
    setComputedSha256("");
    setAiVerdict(null);
  };

  const handleRequestTrancheRelease = async (camp: Campaign, m: Milestone) => {
    if (!isConnected) {
      const connected = await connect();
      if (!connected) return;
    }

    setActiveProcessingMilestoneId(m.id);
    const memoText = `[TRANCHE RELEASE] Запрос выплаты транша ${m.amountSol} SOL по этапу: ${m.title}`;
    const result = await writeMemo(provider, memoText);

    if (result) {
      approveMilestone(camp.id, m.id, result.signature, result.explorerUrl);
    }
    setActiveProcessingMilestoneId(null);
  };

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newTargetSol);
    if (!newTitle || isNaN(target) || target <= 0) return;

    if (!isConnected) {
      const connected = await connect();
      if (!connected) return;
    }

    const memoText = `[CREATE CAMPAIGN] Сбор «${newTitle}» на сумму ${target} SOL`;
    const result = await writeMemo(provider, memoText);

    createCampaign(
      {
        title: newTitle,
        description: newDesc,
        category: newCategory,
        organizer: "Благотворительный фонд",
        organizerAddress: formattedAddress || "7xKX...AidChain",
        targetAmountSol: target,
        deadline: newDeadline,
        coverImage: "/images/hero-bg.jpg",
        milestones: [
          {
            id: `m-new-${Date.now()}-1`,
            order: 1,
            title: "Аванс 20%: Первичная подготовка",
            amountSol: +(target * 0.2).toFixed(2),
            percent: 20,
            status: "pending",
            budgetItems: [{ id: "b1", name: "Первичные материалы", qty: 1, unit: "лот", priceSol: +(target * 0.2).toFixed(2) }],
          },
          {
            id: `m-new-${Date.now()}-2`,
            order: 2,
            title: "Транш 1 (40%): Основная поставка",
            amountSol: +(target * 0.4).toFixed(2),
            percent: 40,
            status: "pending",
            budgetItems: [{ id: "b2", name: "Оборудование и комплектующие", qty: 1, unit: "компл.", priceSol: +(target * 0.4).toFixed(2) }],
          },
          {
            id: `m-new-${Date.now()}-3`,
            order: 3,
            title: "Транш 2 (40%): Монтаж и распределение",
            amountSol: +(target * 0.4).toFixed(2),
            percent: 40,
            status: "pending",
            budgetItems: [{ id: "b3", name: "Логистика и доставка", qty: 1, unit: "рейс", priceSol: +(target * 0.4).toFixed(2) }],
          },
        ],
      },
      result?.signature,
      result?.explorerUrl
    );

    setShowCreateModal(false);
    setNewTitle("");
    setNewDesc("");
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

      {/* Верхний баннер кабинета Фонда: чистый светлый / обсидиановый стиль */}
      <div className="relative overflow-hidden rounded-[26px] glass-card p-6 sm:p-8 transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-3.5 w-3.5" />
              <span>Панель Организатора : НПО и Фонды</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
              Кабинет Фонда: прозрачные транши и AI-отчётность
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Создавайте целевые сборы со сметами, загружайте чеки поставщиков для автоматической сверки AI-оракулом и получайте транши без бюрократии.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white dark:shadow-[0_0_20px_rgba(37,99,235,0.35)] px-4 py-2.5 text-xs font-bold active:scale-[0.98] transition shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Создать целевой сбор</span>
          </button>
        </div>
      </div>

      {/* Управление кампаниями фонда */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">
            Ваши кампании и этапы отчётности
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Управляйте этапами сборов и прикрепляйте фискальные документы для разблокировки траншей
          </p>
        </div>

        <div className="space-y-6">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="rounded-[24px] glass-card p-6 space-y-6 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {camp.category}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Цель: {camp.targetAmountSol} SOL (Собрано: {camp.collectedAmountSol} SOL)
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display mt-1">
                    {camp.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Дедлайн: {camp.deadline}</span>
                </div>
              </div>

              {/* Этапы сбора */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {camp.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col justify-between rounded-2xl glass-card-subtle p-4 text-xs space-y-3 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          Этап #{m.order}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-mono ${
                            m.status === "approved"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : m.status === "submitted"
                              ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30"
                              : m.status === "rejected"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                              : "bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent"
                          }`}
                        >
                          {m.status === "approved"
                            ? "Транш выплачен"
                            : m.status === "submitted"
                            ? "Чек подан"
                            : m.status === "rejected"
                            ? "Отклонён"
                            : "Ожидает чек"}
                        </span>
                      </div>

                      <h4 className="font-semibold text-slate-900 dark:text-white mt-1.5">{m.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        Сумма: {m.amountSol} SOL ({m.percent}%)
                      </p>

                      {/* Смета */}
                      <div className="mt-3 rounded-xl bg-black/[0.02] dark:bg-black/30 p-2.5 space-y-1 border border-black/5 dark:border-white/5">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">
                          Плановые позиции:
                        </div>
                        {m.budgetItems.map((b) => (
                          <div key={b.id} className="flex justify-between text-[10px] text-slate-600 dark:text-slate-300">
                            <span>{b.name}</span>
                            <span className="font-mono text-slate-900 dark:text-slate-200 font-medium">
                              {(b.qty * b.priceSol).toFixed(2)} SOL
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Информация о чеке */}
                      {m.receiptName && (
                        <div
                          className={`mt-2.5 rounded-lg border p-2 text-[10px] space-y-1 ${
                            (m.confidenceScore ?? 100) >= 80
                              ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                              : "border-amber-500/20 bg-amber-500/[0.06]"
                          }`}
                        >
                          <div className="text-slate-700 dark:text-slate-300">
                            Чек: <span className="text-slate-900 dark:text-white font-mono font-medium">{m.receiptName}</span>
                          </div>
                          {m.confidenceScore && (
                            <div
                              className={`font-mono font-medium flex items-center gap-1 ${
                                m.confidenceScore >= 80
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {m.confidenceScore >= 80 ? (
                                <>
                                  <CheckCircle className="h-3 w-3" />
                                  <span>AI Confidence: {m.confidenceScore}% (Верифицирован)</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>AI Confidence: {m.confidenceScore}% (Требует проверки HITL)</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Кнопки действия по этапу */}
                    <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
                      {m.status === "pending" && (
                        <button
                          onClick={() => setSelectedMilestone({ campaignId: camp.id, milestone: m })}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] backdrop-blur-md py-2 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-white/[0.1] active:scale-[0.98] transition shadow-xs"
                        >
                          <UploadCloud className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                          <span>Загрузить чек (AI)</span>
                        </button>
                      )}

                      {m.status === "submitted" && (
                        m.confidenceScore && m.confidenceScore < 80 ? (
                          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2 text-center text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            <span>⚠️ Направлен на арбитраж администратора (HITL)</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRequestTrancheRelease(camp, m)}
                            disabled={isWriting && activeProcessingMilestoneId === m.id}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white py-2 px-3 text-xs font-bold active:scale-[0.98] transition shadow-sm disabled:opacity-50"
                          >
                            {isWriting && activeProcessingMilestoneId === m.id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Выплачиваем...</span>
                              </>
                            ) : (
                              <>
                                <Cpu className="h-3.5 w-3.5" />
                                <span>Запросить выплату транша</span>
                              </>
                            )}
                          </button>
                        )
                      )}

                      {m.status === "approved" && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium justify-center py-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Средства разблокированы</span>
                        </div>
                      )}

                      {m.status === "rejected" && (
                        <button
                          onClick={() => setSelectedMilestone({ campaignId: camp.id, milestone: m })}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 px-3 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 active:scale-[0.98] transition"
                        >
                          <UploadCloud className="h-3.5 w-3.5" />
                          <span>Загрузить исправленный чек</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Модалка загрузки чека и AI-валидации */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[28px] sm:rounded-[32px] bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-3xl border border-slate-200/90 dark:border-white/10 p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.18),0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all">
            {/* Заголовок модалки */}
            <div className="flex items-start justify-between gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                      AI-Валидация чека
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300">
                      Смета: {selectedMilestone.milestone.amountSol} SOL
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {selectedMilestone.milestone.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMilestone(null);
                  setUploadFileName("");
                  setComputedSha256("");
                  setAiVerdict(null);
                }}
                className="rounded-full h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Поле выбора файла с поддержкой Drag and Drop (если файл ещё не загружен) */}
              {!computedSha256 && !isAiAnalyzing && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processReceiptFile(file);
                  }}
                  className={`group rounded-2xl border-2 border-dashed p-6 sm:p-7 text-center transition-all duration-200 ${
                    isDragging
                      ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                      : "border-blue-500/30 dark:border-blue-400/25 hover:border-blue-500/60 dark:hover:border-blue-400/50 bg-gradient-to-b from-blue-50/40 via-white/40 to-slate-50/40 dark:from-blue-950/20 dark:via-white/[0.01] dark:to-transparent"
                  }`}
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-[0_4px_16px_rgba(59,130,246,0.12)] group-hover:scale-105 transition-transform duration-200">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Перетащите фото фискального чека или накладной
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    JPG, PNG, PDF • Хэш SHA-256 вычисляется локально в браузере
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="receipt-file-input"
                    />
                    <label
                      htmlFor="receipt-file-input"
                      className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold shadow-[0_2px_12px_rgba(37,99,235,0.3)] active:scale-[0.98] transition"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>Выбрать файл</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleUseDemoReceipt}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300 active:scale-[0.98] transition shadow-xs"
                    >
                      <Zap className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Тестовый чек (1 клик)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Карточка загруженного файла и SHA-256 хэша */}
              {computedSha256 && (
                <div className="rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {uploadFileName || "Документ чека"}
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>SHA-256 верифицирован ✓</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setComputedSha256("");
                        setAiVerdict(null);
                        setUploadFileName("");
                      }}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      Заменить файл
                    </button>
                  </div>

                  <div className="rounded-xl bg-white dark:bg-black/40 border border-slate-200/70 dark:border-white/5 p-2 font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all select-all flex items-start gap-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">
                      ХЭШ:
                    </span>
                    <span className="leading-tight">{computedSha256}</span>
                  </div>
                </div>
              )}

              {/* Индикатор AI-анализа с анимированным лучом сканирования */}
              {isAiAnalyzing && (
                <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-500/[0.05] p-5 text-center space-y-3">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
                  <div className="h-7 w-7 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      AI-оракул считывает фискальные реквизиты...
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Автоматическая OCR-сверка ИИН/БИН поставщика, позиций сметы и сумм транша
                    </p>
                  </div>
                </div>
              )}

              {/* Результат AI-верификации: Премиальная карточка */}
              {aiVerdict && (
                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.08] to-emerald-500/[0.02] p-4 sm:p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <span>Чек успешно верифицирован AI-оракулом</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-950 dark:text-slate-950 bg-emerald-400 px-2.5 py-0.5 rounded-full text-[11px] shadow-xs">
                      Точность: {aiVerdict.confidenceScore}%
                    </span>
                  </div>

                  {/* 4 плитки с метриками */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Поставщик</span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate block mt-0.5">
                        {aiVerdict.vendorName}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">БИН / ИИН</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white truncate block mt-0.5">
                        {aiVerdict.vendorBin}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Сумма чека</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        {aiVerdict.ocrTotal} SOL
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Сверка со сметой</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle className="h-3 w-3" />
                        100% совпадение
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-500/15 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Фискальный признак подтверждён • Хэш готов к фиксации в транзакции Solana</span>
                  </div>
                </div>
              )}
            </div>

            {/* Футер модалки */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex gap-3">
              <button
                onClick={handleConfirmReceipt}
                disabled={!aiVerdict}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 text-xs shadow-[0_2px_12px_rgba(37,99,235,0.3)] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition flex items-center justify-center gap-2"
              >
                <span>Сохранить отчёт и отправить на выплату</span>
              </button>
              <button
                onClick={() => {
                  setSelectedMilestone(null);
                  setUploadFileName("");
                  setComputedSha256("");
                  setAiVerdict(null);
                }}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-medium py-2.5 px-4 text-xs transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка создания сбора */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[28px] sm:rounded-[32px] bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-3xl border border-slate-200/90 dark:border-white/10 p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.18),0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all">
            <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold">
                  Новая кампания
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display mt-0.5">
                  Создать целевой сбор в эскроу
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Название сбора:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Покупка медицинского оборудования"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-black/30 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Описание и цель:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Опишите, кому и как будет оказана помощь..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-black/30 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Сумма цели (SOL):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={newTargetSol}
                    onChange={(e) => setNewTargetSol(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-black/30 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Дедлайн:
                  </label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-black/30 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-3 text-[11px] text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-blue-600 dark:text-blue-400">Поэтапный график траншей:</span>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  20% аванс ({(+newTargetSol * 0.2).toFixed(1)} SOL) → 40% транш №1 ({(+newTargetSol * 0.4).toFixed(1)} SOL) по чеку → 40% транш №2 ({(+newTargetSol * 0.4).toFixed(1)} SOL) по приёмке.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex gap-3">
                <button
                  type="submit"
                  disabled={isWriting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white py-2.5 px-4 text-xs font-bold active:scale-[0.98] disabled:opacity-50 transition shadow-sm"
                >
                  {isWriting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Записываем в блокчейн...</span>
                    </>
                  ) : (
                    <span>Опубликовать сбор в блокчейне</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-medium py-2.5 px-4 text-xs transition"
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
