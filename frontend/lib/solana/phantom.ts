import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { PhantomProvider } from "@/types/solana";

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

export const DEVNET_RPC_URL = "https://api.devnet.solana.com";

/**
 * Возвращает провайдер Phantom кошелька из window
 */
export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;

  if (window.phantom?.solana?.isPhantom) {
    return window.phantom.solana;
  }

  if (window.solana?.isPhantom) {
    return window.solana;
  }

  return null;
}

/**
 * Инициализирует подключение к Solana Devnet
 */
export function getSolanaConnection(): Connection {
  return new Connection(DEVNET_RPC_URL, "confirmed");
}

/**
 * Получает баланс в SOL в сети Devnet
 */
export async function getDevnetSolBalance(publicKey: PublicKey): Promise<number | null> {
  try {
    const connection = getSolanaConnection();
    const balanceInLamports = await connection.getBalance(publicKey, "confirmed");
    return balanceInLamports / LAMPORTS_PER_SOL;
  } catch (error) {
    console.warn("Ошибка получения баланса Devnet:", error);
    return null;
  }
}

/**
 * Форматирует публичный ключ: первые 4 и последние 4 символа (AAAA...BBBB)
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 8) return address || "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Формирует ссылку на транзакцию в Solana Explorer (Devnet)
 */
export function getSolanaExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

/**
 * Создаёт инструкцию SPL Memo строго через нативный TextEncoder (без Buffer)
 */
export function createMemoInstruction(
  memoText: string,
  signerPublicKey: PublicKey
): TransactionInstruction {
  // ТРЕБОВАНИЕ: Использовать TextEncoder, НЕ Buffer
  const encoder = new TextEncoder();
  const memoData = encoder.encode(memoText);

  return new TransactionInstruction({
    keys: [{ pubkey: signerPublicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: memoData as unknown as Buffer,
  });
}

/**
 * Отправляет транзакцию с Memo инструкцией через подключенный Phantom
 */
export async function sendMemoTransaction(
  provider: PhantomProvider,
  memoText: string
): Promise<{ signature: string; explorerUrl: string }> {
  if (!provider.publicKey) {
    throw new Error("Кошелёк Phantom не подключён.");
  }

  const connection = getSolanaConnection();
  const payerPubkey = provider.publicKey;

  // 1. Создаем транзакцию с одной инструкцией Memo
  const transaction = new Transaction();
  const memoInstruction = createMemoInstruction(memoText, payerPubkey);
  transaction.add(memoInstruction);

  // 2. Получаем актуальный blockhash сети Devnet
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payerPubkey;

  try {
    // 3. Отправляем через Phantom (комиссию платит пользователь)
    const { signature } = await provider.signAndSendTransaction(transaction);

    // 4. Ожидаем подтверждения транзакции в сети Devnet
    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    return {
      signature,
      explorerUrl: getSolanaExplorerUrl(signature),
    };
  } catch (error: any) {
    // Понятные сообщения на русском языке
    const message = error?.message || "";
    if (
      message.includes("User rejected") ||
      error?.code === 4001 ||
      message.includes("rejected the request")
    ) {
      throw new Error("Транзакция отменена в кошельке Phantom.");
    }
    if (message.includes("Attempt to debit an account but found no record") || message.includes("insufficient funds")) {
      throw new Error(
        "Недостаточно SOL на балансе в сети Devnet для оплаты комиссии. Пополните кошелёк через кран devnet.solana.com."
      );
    }
    if (message.includes("Blockhash not found") || message.includes("expired")) {
      throw new Error("Время подтверждения транзакции истекло. Повторите попытку.");
    }
    throw new Error(message || "Ошибка отправки транзакции в сеть Solana Devnet.");
  }
}
