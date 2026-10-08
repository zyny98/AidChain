"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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
  isRefreshing: boolean;
  refreshSuccess: boolean;
  error: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
}

const WALLET_CONNECTED_KEY = "aidchain_phantom_connected";

const defaultWalletState: UsePhantomWalletReturn = {
  provider: null,
  publicKey: null,
  walletAddress: null,
  formattedAddress: "",
  balanceSol: null,
  isPhantomInstalled: false,
  isConnected: false,
  isConnecting: false,
  isRefreshing: false,
  refreshSuccess: false,
  error: null,
  connect: async () => false,
  disconnect: async () => {},
  refreshBalance: async () => {},
  clearError: () => {},
};

const PhantomWalletContext = createContext<UsePhantomWalletReturn>(defaultWalletState);

export function PhantomWalletProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balanceSol, setBalanceSol] = useState<number | null>(null);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshSuccess, setRefreshSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (pubkey: PublicKey) => {
    try {
      const bal = await getDevnetSolBalance(pubkey);
      if (bal !== null) {
        setBalanceSol(bal);
      }
    } catch (err) {
      console.warn("Devnet balance fetch error:", err);
    }
  }, []);

  // Инициализация, проверка Phantom и eager auto-reconnect
  useEffect(() => {
    const initWallet = async () => {
      const phantom = getPhantomProvider();
      if (!phantom) {
        setIsPhantomInstalled(false);
        return;
      }

      setProvider(phantom);
      setIsPhantomInstalled(true);

      const wasConnected =
        typeof window !== "undefined" &&
        localStorage.getItem(WALLET_CONNECTED_KEY) === "true";

      if (phantom.publicKey && phantom.isConnected) {
        setPublicKey(phantom.publicKey);
        setWalletAddress(phantom.publicKey.toBase58());
        setIsConnected(true);
        fetchBalance(phantom.publicKey);
      } else if (wasConnected) {
        try {
          const resp = await phantom.connect({ onlyIfTrusted: true });
          if (resp?.publicKey) {
            setPublicKey(resp.publicKey);
            setWalletAddress(resp.publicKey.toBase58());
            setIsConnected(true);
            fetchBalance(resp.publicKey);
          }
        } catch (_) {
          // Пользователь отклонил или отозвал права в расширении Phantom
        }
      }
    };

    initWallet();

    const phantom = getPhantomProvider();
    const handleAccountChange = (newPublicKey: PublicKey | null) => {
      if (newPublicKey) {
        setPublicKey(newPublicKey);
        setWalletAddress(newPublicKey.toBase58());
        setIsConnected(true);
        try {
          localStorage.setItem(WALLET_CONNECTED_KEY, "true");
        } catch (_) {}
        fetchBalance(newPublicKey);
      } else {
        setPublicKey(null);
        setWalletAddress(null);
        setIsConnected(false);
        setBalanceSol(null);
        try {
          localStorage.removeItem(WALLET_CONNECTED_KEY);
        } catch (_) {}
      }
    };

    const handleDisconnect = () => {
      setPublicKey(null);
      setWalletAddress(null);
      setIsConnected(false);
      setBalanceSol(null);
      try {
        localStorage.removeItem(WALLET_CONNECTED_KEY);
      } catch (_) {}
    };

    if (phantom) {
      phantom.on?.("accountChanged", handleAccountChange);
      phantom.on?.("disconnect", handleDisconnect);
    }

    return () => {
      if (phantom) {
        phantom.removeListener?.("accountChanged", handleAccountChange);
        phantom.removeListener?.("disconnect", handleDisconnect);
      }
    };
  }, [fetchBalance]);

  // Обновление баланса с явной визуальной индикацией
  const refreshBalance = useCallback(async () => {
    const activePubkey = publicKey || provider?.publicKey;
    if (!activePubkey) return;

    setIsRefreshing(true);
    setRefreshSuccess(false);

    try {
      const bal = await getDevnetSolBalance(activePubkey);
      if (bal !== null) {
        setBalanceSol(bal);
        setRefreshSuccess(true);
        setTimeout(() => {
          setRefreshSuccess(false);
        }, 2500);
      }
    } catch (e) {
      console.error("Ошибка при обновлении баланса SOL:", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [publicKey, provider]);

  // Подключение к Phantom
  const connect = useCallback(async (): Promise<boolean> => {
    setError(null);
    const phantom = getPhantomProvider();

    if (!phantom) {
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

      try {
        localStorage.setItem(WALLET_CONNECTED_KEY, "true");
      } catch (_) {}

      await fetchBalance(pubkey);
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
  }, [fetchBalance]);

  // Отключение от Phantom
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
    try {
      localStorage.removeItem(WALLET_CONNECTED_KEY);
    } catch (_) {}
  }, [provider]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const formattedAddress = useMemo(() => {
    return walletAddress ? formatAddress(walletAddress) : "";
  }, [walletAddress]);

  const value = useMemo<UsePhantomWalletReturn>(
    () => ({
      provider,
      publicKey,
      walletAddress,
      formattedAddress,
      balanceSol,
      isPhantomInstalled,
      isConnected,
      isConnecting,
      isRefreshing,
      refreshSuccess,
      error,
      connect,
      disconnect,
      refreshBalance,
      clearError,
    }),
    [
      provider,
      publicKey,
      walletAddress,
      formattedAddress,
      balanceSol,
      isPhantomInstalled,
      isConnected,
      isConnecting,
      isRefreshing,
      refreshSuccess,
      error,
      connect,
      disconnect,
      refreshBalance,
      clearError,
    ]
  );

  return (
    <PhantomWalletContext.Provider value={value}>
      {children}
    </PhantomWalletContext.Provider>
  );
}

export function usePhantomWallet(): UsePhantomWalletReturn {
  return useContext(PhantomWalletContext);
}
