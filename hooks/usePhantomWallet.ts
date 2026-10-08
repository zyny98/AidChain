"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  getPhantomProvider,
  getDevnetSolBalance,
  formatAddress,
} from "@/lib/solana/phantom";
import { PhantomProvider } from "@/types/solana";

export interface UsePhantomWalletReturn {
  provider: PhantomProvider | null;
  publicKey: PublicKey | null;
  walletAddress: string | null;
  formattedAddress: string;
  balanceSol: number | null;
  isPhantomInstalled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
}

export function usePhantomWallet(): UsePhantomWalletReturn {
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balanceSol, setBalanceSol] = useState<number | null>(null);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Инициализация и проверка наличия Phantom в браузере
  useEffect(() => {
    const checkProvider = () => {
      const phantom = getPhantomProvider();
      if (phantom) {
        setProvider(phantom);
        setIsPhantomInstalled(true);
        if (phantom.publicKey && phantom.isConnected) {
          setPublicKey(phantom.publicKey);
          setWalletAddress(phantom.publicKey.toBase58());
          setIsConnected(true);
          getDevnetSolBalance(phantom.publicKey).then(setBalanceSol);
        }
      } else {
        setIsPhantomInstalled(false);
      }
    };

    checkProvider();

    // Слушатели событий Phantom
    const handleAccountChange = (newPublicKey: PublicKey | null) => {
      if (newPublicKey) {
        setPublicKey(newPublicKey);
        setWalletAddress(newPublicKey.toBase58());
        setIsConnected(true);
        getDevnetSolBalance(newPublicKey).then(setBalanceSol);
      } else {
        setPublicKey(null);
        setWalletAddress(null);
        setIsConnected(false);
        setBalanceSol(null);
      }
    };

    const phantom = getPhantomProvider();
    if (phantom) {
      phantom.on?.("accountChanged", handleAccountChange);
      phantom.on?.("disconnect", () => {
        handleAccountChange(null);
      });
    }

    return () => {
      if (phantom) {
        phantom.removeListener?.("accountChanged", handleAccountChange);
      }
    };
  }, []);

  // Обновление баланса
  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const bal = await getDevnetSolBalance(publicKey);
      setBalanceSol(bal);
    } catch (e) {
      console.error(e);
    }
  }, [publicKey]);

  // Подключение к Phantom
  const connect = useCallback(async (): Promise<boolean> => {
    setError(null);
    const phantom = getPhantomProvider();

    if (!phantom) {
      // ТОЧНОЕ ТРЕБОВАНИЕ ИЗ ТЗ
      setError("Откройте приложение в отдельной вкладке с установленным Phantom");
      return false;
    }

    try {
      setIsConnecting(true);
      const resp = await phantom.connect();
      const pubkey = resp.publicKey;
      setProvider(phantom);
      setPublicKey(pubkey);
      setWalletAddress(pubkey.toBase58());
      setIsConnected(true);

      const bal = await getDevnetSolBalance(pubkey);
      setBalanceSol(bal);
      return true;
    } catch (err: any) {
      console.warn("Phantom connection error:", err);
      if (err?.code === 4001 || err?.message?.includes("User rejected")) {
        setError("Подключение отклонено пользователем.");
      } else {
        setError(err?.message || "Не удалось подключиться к Phantom кошельку.");
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Отключение
  const disconnect = useCallback(async () => {
    if (provider) {
      try {
        await provider.disconnect();
      } catch (e) {
        console.error(e);
      }
    }
    setPublicKey(null);
    setWalletAddress(null);
    setIsConnected(false);
    setBalanceSol(null);
  }, [provider]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    provider,
    publicKey,
    walletAddress,
    formattedAddress: walletAddress ? formatAddress(walletAddress) : "",
    balanceSol,
    isPhantomInstalled,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    refreshBalance,
    clearError,
  };
}
