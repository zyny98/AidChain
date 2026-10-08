import { PublicKey, Transaction } from "@solana/web3.js";

export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  isConnected?: boolean;
  signAndSendTransaction: (
    transaction: Transaction,
    options?: { skipPreflight?: boolean }
  ) => Promise<{ signature: string }>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
    solana?: PhantomProvider;
  }
}

export interface AuditRecord {
  id: string;
  text: string;
  timestamp: string;
  signature?: string;
  explorerUrl?: string;
  status: "pending" | "confirmed" | "failed";
  role?: "donor" | "foundation" | "vendor" | "admin";
  category?: string;
}
