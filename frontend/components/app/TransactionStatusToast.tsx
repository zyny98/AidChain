"use client";

import React from "react";
import { CheckCircle2, Loader2, AlertCircle, ExternalLink, X } from "lucide-react";

interface TransactionStatusToastProps {
  status: "idle" | "writing" | "success" | "error";
  statusMessage?: string;
  signature?: string | null;
  explorerUrl?: string | null;
  error?: string | null;
  onClose: () => void;
}

export function TransactionStatusToast({
  status,
  statusMessage,
  signature,
  explorerUrl,
  error,
  onClose,
}: TransactionStatusToastProps) {
  if (status === "idle") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300 font-sans">
      <div
        className={`rounded-2xl border p-4 shadow-2xl transition-all ${
          status === "writing"
            ? "border-emerald-500/40 bg-[#121827] text-white"
            : status === "success"
            ? "border-emerald-500/40 bg-[#121827] text-white"
            : "border-rose-500/40 bg-[#121827] text-white"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Иконка статуса */}
            {status === "writing" && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )}
            {status === "error" && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20">
                <AlertCircle className="h-5 w-5" />
              </div>
            )}

            {/* Сообщение */}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold font-display tracking-tight text-white">
                {status === "writing"
                  ? "Записываем в блокчейн..."
                  : status === "success"
                  ? "Записано в блокчейн"
                  : "Ошибка транзакции"}
              </h4>

              {status === "writing" && (
                <p className="text-xs text-slate-400">
                  Ожидаем подтверждения инструкций Memo в сети Solana Devnet...
                </p>
              )}

              {status === "success" && (
                <div>
                  <p className="text-xs text-slate-300">
                    Транзакция успешно зафиксирована в блокчейне.
                  </p>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-400 hover:underline"
                    >
                      Посмотреть запись
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {status === "error" && (
                <p className="text-xs text-rose-300 leading-relaxed">
                  {error || statusMessage || "Операция отклонена."}
                </p>
              )}
            </div>
          </div>

          {/* Кнопка закрытия */}
          {status !== "writing" && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
