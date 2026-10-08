"use client";

import React, { useState } from "react";
import { useAppStore, Campaign, Milestone } from "@/lib/store/app-store";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useSolanaMemo } from "@/hooks/useSolanaMemo";
import { TransactionStatusToast } from "@/components/app/TransactionStatusToast";
import { AuditTrailTable } from "@/components/app/AuditTrailTable";
import {
  Building2,
  Plus,
  UploadCloud,
  CheckCircle,
  Cpu,
  Calendar,
  Loader2,
  Zap,
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
        organizerAddress: formattedAddress || "7xKX...Devnet",
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

      {/* Верхний баннер кабинета Фонда: сдержанный обсидиановый стиль */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121827] p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Building2 className="h-3.5 w-3.5" />
              <span>Панель Организатора : НПО и Фонды</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              Кабинет Фонда: прозрачные транши и AI-отчётность
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              Создавайте целевые сборы со сметами, загружайте чеки поставщиков для автоматической сверки AI-оракулом и получайте транши без бюрократии.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-950 px-4 py-2.5 text-xs font-bold hover:bg-slate-100 active:scale-[0.98] transition shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Создать целевой сбор</span>
          </button>
        </div>
      </div>

      {/* Управление кампаниями фонда */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white font-display tracking-tight">
            Ваши кампании и этапы отчётности
          </h2>
          <p className="text-xs text-slate-400">
            Управляйте этапами сборов и прикрепляйте фискальные документы для разблокировки траншей
          </p>
        </div>

        <div className="space-y-6">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="rounded-2xl border border-white/[0.08] bg-[#121827] p-6 space-y-6 shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/[0.04] border border-white/[0.1] px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
                      {camp.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Цель: {camp.targetAmountSol} SOL (Собрано: {camp.collectedAmountSol} SOL)
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-display mt-1">
                    {camp.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Дедлайн: {camp.deadline}</span>
                </div>
              </div>

              {/* Этапы сбора */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {camp.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-emerald-400 font-bold">
                          Этап #{m.order}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-mono ${
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
                            ? "Транш выплачен"
                            : m.status === "submitted"
                            ? "Чек подан"
                            : m.status === "rejected"
                            ? "Отклонён"
                            : "Ожидает чек"}
                        </span>
                      </div>

                      <h4 className="font-semibold text-white mt-1.5">{m.title}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Сумма: {m.amountSol} SOL ({m.percent}%)
                      </p>

                      {/* Смета */}
                      <div className="mt-3 rounded-lg bg-black/40 p-2.5 space-y-1 border border-white/[0.04]">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">
                          Плановые позиции:
                        </div>
                        {m.budgetItems.map((b) => (
                          <div key={b.id} className="flex justify-between text-[10px] text-slate-300">
                            <span>{b.name}</span>
                            <span className="font-mono text-slate-200">
                              {(b.qty * b.priceSol).toFixed(2)} SOL
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Информация о чеке */}
                      {m.receiptName && (
                        <div className="mt-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-2 text-[10px] space-y-1">
                          <div className="text-slate-300">
                            Чек: <span className="text-white font-mono">{m.receiptName}</span>
                          </div>
                          {m.confidenceScore && (
                            <div className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              AI Confidence: {m.confidenceScore}% (Верифицирован)
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Кнопки действия по этапу */}
                    <div className="pt-2 border-t border-white/[0.06]">
                      {m.status === "pending" && (
                        <button
                          onClick={() => setSelectedMilestone({ campaignId: camp.id, milestone: m })}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] py-2 px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] active:scale-[0.98] transition shadow-sm"
                        >
                          <UploadCloud className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Загрузить чек (AI)</span>
                        </button>
                      )}

                      {m.status === "submitted" && (
                        <button
                          onClick={() => handleRequestTrancheRelease(camp, m)}
                          disabled={isWriting && activeProcessingMilestoneId === m.id}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 text-slate-950 py-2 px-3 text-xs font-bold hover:bg-emerald-400 active:scale-[0.98] transition shadow-sm disabled:opacity-50"
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
                      )}

                      {m.status === "approved" && (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium justify-center py-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Средства разблокированы</span>
                        </div>
                      )}

                      {m.status === "rejected" && (
                        <button
                          onClick={() => setSelectedMilestone({ campaignId: camp.id, milestone: m })}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 px-3 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 active:scale-[0.98] transition"
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

      {/* Audit Trail */}
      <section className="pt-2">
        <AuditTrailTable />
      </section>

      {/* Модалка загрузки чека и AI-валидации */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0e131f]/95 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  Отчётность и AI-валидация
                </span>
                <h3 className="text-lg font-bold text-white font-display mt-0.5">
                  {selectedMilestone.milestone.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMilestone(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.05] hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Поле выбора файла с поддержкой Drag and Drop */}
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
                className={`rounded-xl border border-dashed p-6 text-center transition ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-white/[0.15] bg-white/[0.02] hover:border-emerald-500/40"
                }`}
              >
                <UploadCloud className="h-7 w-7 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-white mb-1">
                  Перетащите фото фискального чека или накладной
                </p>
                <p className="text-[11px] text-slate-400 mb-3">
                  JPG, PNG, PDF. Хэш SHA-256 вычисляется мгновенно в браузере.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="receipt-file-input"
                  />
                  <label
                    htmlFor="receipt-file-input"
                    className="inline-flex cursor-pointer rounded-lg bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/[0.15] active:scale-[0.98] transition"
                  >
                    Выбрать файл
                  </label>

                  <button
                    type="button"
                    onClick={handleUseDemoReceipt}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 active:scale-[0.98] transition"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Тестовый чек (1 клик)</span>
                  </button>
                </div>
              </div>

              {/* Отображение вычисленного SHA-256 хэша */}
              {computedSha256 && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs space-y-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Файл: {uploadFileName}</span>
                    <span className="text-emerald-400 font-semibold">Хэш SHA-256 вычислен ✓</span>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-400 break-all">
                    {computedSha256}
                  </div>
                </div>
              )}

              {/* Индикатор AI-анализа */}
              {isAiAnalyzing && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-center space-y-2">
                  <div className="h-5 w-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-emerald-400">
                    AI-оракул считывает фискальные реквизиты и сверяет со сметой...
                  </p>
                </div>
              )}

              {/* Результат AI-верификации */}
              {aiVerdict && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      Чек успешно верифицирован оракулом
                    </span>
                    <span className="font-mono font-bold text-slate-950 bg-emerald-400 px-2 py-0.5 rounded text-[10px]">
                      Score: {aiVerdict.confidenceScore}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-[11px] text-slate-200">
                    <div>Продавец: <span className="font-semibold text-white">{aiVerdict.vendorName}</span></div>
                    <div>БИН: <span className="font-mono text-white">{aiVerdict.vendorBin}</span></div>
                    <div>Сумма чека: <span className="font-mono font-bold text-emerald-400">{aiVerdict.ocrTotal} SOL</span></div>
                    <div>Соответствие смете: <span className="text-emerald-400 font-bold">100% совпадение</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex gap-3">
              <button
                onClick={handleConfirmReceipt}
                disabled={!aiVerdict}
                className="flex-1 rounded-xl bg-white text-slate-950 py-2.5 px-4 text-xs font-bold hover:bg-slate-100 active:scale-[0.98] disabled:opacity-40 transition shadow-sm"
              >
                Сохранить отчёт и отправить на выплату
              </button>
              <button
                onClick={() => setSelectedMilestone(null)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 px-4 text-xs font-medium text-slate-400 hover:bg-white/[0.08] hover:text-white transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка создания сбора */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0e131f]/95 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  Новая кампания
                </span>
                <h3 className="text-lg font-bold text-white font-display mt-0.5">
                  Создать целевой сбор в эскроу
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.05] hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Название сбора:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Покупка медицинского оборудования"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Описание и цель:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Опишите, кому и как будет оказана помощь..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Сумма цели (SOL Devnet):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={newTargetSol}
                    onChange={(e) => setNewTargetSol(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Дедлайн:
                  </label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3 text-[11px] text-slate-300">
                <span className="font-semibold text-emerald-400">Поэтапный график траншей:</span>
                <p className="mt-1">
                  20% аванс ({(+newTargetSol * 0.2).toFixed(1)} SOL) → 40% транш №1 ({(+newTargetSol * 0.4).toFixed(1)} SOL) по чеку → 40% транш №2 ({(+newTargetSol * 0.4).toFixed(1)} SOL) по приёмке.
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex gap-3">
                <button
                  type="submit"
                  disabled={isWriting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-950 py-2.5 px-4 text-xs font-bold hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50 transition shadow-sm"
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
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 px-4 text-xs font-medium text-slate-400 hover:bg-white/[0.08] hover:text-white transition"
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
