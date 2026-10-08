"use client";

import { useState, useCallback } from "react";
import { PhantomProvider } from "@/types/solana";
import { sendMemoTransaction } from "@/lib/solana/phantom";

export interface UseSolanaMemoReturn {
  isWriting: boolean;
  status: "idle" | "writing" | "success" | "error";
  statusMessage: string;
  lastSignature: string | null;
  lastExplorerUrl: string | null;
  error: string | null;
  writeMemo: (
    provider: PhantomProvider | null,
    memoText: string
  ) => Promise<{ signature: string; explorerUrl: string } | null>;
  resetStatus: () => void;
}

export function useSolanaMemo(): UseSolanaMemoReturn {
  const [isWriting, setIsWriting] = useState(false);
  const [status, setStatus] = useState<"idle" | "writing" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [lastExplorerUrl, setLastExplorerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetStatus = useCallback(() => {
    setIsWriting(false);
    setStatus("idle");
    setStatusMessage("");
    setError(null);
  }, []);

  const writeMemo = useCallback(
    async (
      provider: PhantomProvider | null,
      memoText: string
    ): Promise<{ signature: string; explorerUrl: string } | null> => {
      setError(null);

      if (!provider || !provider.publicKey) {
        const errMsg = "Сначала подключите кошелёк Phantom для записи в блокчейн.";
        setError(errMsg);
        setStatus("error");
        setStatusMessage(errMsg);
        return null;
      }

      setIsWriting(true);
      setStatus("writing");
      // ТОЧНОЕ ТРЕБОВАНИЕ: «Записываем в блокчейн…»
      setStatusMessage("Записываем в блокчейн…");

      try {
        const result = await sendMemoTransaction(provider, memoText);
        setLastSignature(result.signature);
        setLastExplorerUrl(result.explorerUrl);
        setStatus("success");
        // ТОЧНОЕ ТРЕБОВАНИЕ: «Записано в блокчейн»
        setStatusMessage("Записано в блокчейн");
        return result;
      } catch (err: any) {
        console.error("Memo tx failed:", err);
        const errMsg = err?.message || "Ошибка записи в блокчейн.";
        setError(errMsg);
        setStatus("error");
        setStatusMessage(errMsg);
        return null;
      } finally {
        setIsWriting(false);
      }
    },
    []
  );

  return {
    isWriting,
    status,
    statusMessage,
    lastSignature,
    lastExplorerUrl,
    error,
    writeMemo,
    resetStatus,
  };
}
