"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuditRecord } from "@/types/solana";

export type UserRole = "donor" | "foundation" | "vendor" | "admin";

export interface BudgetItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  priceSol: number;
}

export interface Milestone {
  id: string;
  order: number;
  title: string;
  amountSol: number;
  percent: number;
  status: "pending" | "submitted" | "approved" | "rejected" | "expired";
  budgetItems: BudgetItem[];
  reportHash?: string;
  receiptName?: string;
  receiptUrl?: string;
  ocrTotal?: number;
  confidenceScore?: number;
  rejectionReason?: string;
  vendorName?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  organizer: string;
  organizerAddress: string;
  targetAmountSol: number;
  collectedAmountSol: number;
  deadline: string;
  coverImage: string;
  status: "active" | "completed" | "cancelled";
  milestones: Milestone[];
}

export interface HitlItem {
  id: string;
  campaignId: string;
  milestoneId: string;
  campaignTitle: string;
  milestoneTitle: string;
  fileName: string;
  fileHashSha256: string;
  vendorName: string;
  vendorBin: string;
  claimedAmountSol: number;
  budgetAmountSol: number;
  confidenceScore: number;
  flags: string[];
  ocrItems: { name: string; qty: number; priceSol: number }[];
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  bin: string;
  category: string;
  walletAddress: string;
  status: "whitelisted" | "pending" | "blocked";
  completedOrdersCount: number;
  totalPaidSol: number;
  invoices: {
    id: string;
    campaignId: string;
    campaignTitle: string;
    milestoneId: string;
    milestoneTitle: string;
    amountSol: number;
    status: "paid" | "pending_verification";
    invoiceNumber: string;
    date: string;
  }[];
}

export interface UserDonation {
  id: string;
  campaignId: string;
  campaignTitle: string;
  amountSol: number;
  timestamp: string;
  signature?: string;
  explorerUrl?: string;
  status: "escrowed" | "released" | "refunded";
  refundAmountSol?: number;
}

interface AppStoreContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  campaigns: Campaign[];
  hitlQueue: HitlItem[];
  vendors: Vendor[];
  donations: UserDonation[];
  auditRecords: AuditRecord[];
  addAuditRecord: (record: Omit<AuditRecord, "id">) => AuditRecord;
  addDonation: (
    campaignId: string,
    amountSol: number,
    signature?: string,
    explorerUrl?: string
  ) => void;
  createCampaign: (
    campaign: Omit<Campaign, "id" | "collectedAmountSol" | "status">,
    signature?: string,
    explorerUrl?: string
  ) => void;
  uploadReceipt: (
    campaignId: string,
    milestoneId: string,
    data: {
      fileName: string;
      fileHashSha256: string;
      vendorName: string;
      vendorBin: string;
      ocrTotal: number;
      confidenceScore: number;
      flags: string[];
      ocrItems: { name: string; qty: number; priceSol: number }[];
    }
  ) => void;
  approveMilestone: (
    campaignId: string,
    milestoneId: string,
    signature?: string,
    explorerUrl?: string
  ) => void;
  rejectMilestone: (
    campaignId: string,
    milestoneId: string,
    reason: string,
    signature?: string,
    explorerUrl?: string
  ) => void;
  adminApproveHitl: (
    hitlId: string,
    signature?: string,
    explorerUrl?: string
  ) => void;
  adminRejectHitl: (
    hitlId: string,
    reason: string,
    signature?: string,
    explorerUrl?: string
  ) => void;
  toggleVendorWhitelist: (vendorId: string) => void;
  claimVendorPayout: (
    vendorId: string,
    invoiceId: string,
    signature?: string,
    explorerUrl?: string
  ) => void;
  requestRefund: (
    donationId: string,
    campaignId: string,
    refundAmountSol: number,
    signature?: string,
    explorerUrl?: string
  ) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEY = "aidchain_app_store_v4";

const initialCampaigns: Campaign[] = [
  {
    id: "camp-1",
    title: "Ремонт инклюзивной детской площадки",
    description:
      "Установка безопасного резинового покрытия, тактильной плитки и специальных качелей для детей с особыми потребностями в Алматы.",
    category: "Городская среда & Инклюзия",
    organizer: "БФ «Жүрек Жылуы»",
    organizerAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    targetAmountSol: 15,
    collectedAmountSol: 12.5,
    deadline: "2026-11-15",
    coverImage: "/images/hero-bg.jpg",
    status: "active",
    milestones: [
      {
        id: "m-101",
        order: 1,
        title: "Аванс 20%: проектирование и согласование",
        amountSol: 3,
        percent: 20,
        status: "approved",
        budgetItems: [
          { id: "b1", name: "Проектная документация и согласование с акиматом", qty: 1, unit: "усл.", priceSol: 3 },
        ],
        reportHash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
        receiptName: "act_approval_almaty.pdf",
        confidenceScore: 99,
        vendorName: "ТОО «Архитектурное бюро Алматы»",
      },
      {
        id: "m-102",
        order: 2,
        title: "Транш 1 (40%): Закупка резиновой крошки и клея",
        amountSol: 6,
        percent: 40,
        status: "submitted",
        budgetItems: [
          { id: "b2", name: "Резиновая плитка бесшовная (30мм)", qty: 120, unit: "кв.м", priceSol: 0.035 },
          { id: "b3", name: "Полиуретановое связующее клей", qty: 15, unit: "канистр", priceSol: 0.12 },
        ],
        reportHash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        receiptName: "fiscal_receipt_kazpolymer_482.jpg",
        ocrTotal: 5.95,
        confidenceScore: 96,
        vendorName: "ТОО «КазПолимер Строй»",
      },
      {
        id: "m-103",
        order: 3,
        title: "Транш 2 (40%): Закупка игровых модулей и монтаж",
        amountSol: 6,
        percent: 40,
        status: "pending",
        budgetItems: [
          { id: "b4", name: "Качели для инвалидных колясок со страховкой", qty: 2, unit: "шт", priceSol: 1.8 },
          { id: "b5", name: "Тактильный развивающий стенд", qty: 3, unit: "шт", priceSol: 0.8 },
        ],
      },
    ],
  },
  {
    id: "camp-2",
    title: "Медикаменты для детского реабилитационного центра",
    description:
      "Срочный закуп специализированных ортопедических корсетов и расходных медицинских материалов для 40 подопечных центра в Астане.",
    category: "Здравоохранение",
    organizer: "ОО «Мейірім Шұғыласы»",
    organizerAddress: "4Z8f8C6q7E8u9h3TkV1oP5aB9dL4xY2rJ0sW6mN8tQ7z",
    targetAmountSol: 20,
    collectedAmountSol: 16.0,
    deadline: "2026-10-30",
    coverImage: "/images/hero-bg.jpg",
    status: "active",
    milestones: [
      {
        id: "m-201",
        order: 1,
        title: "Аванс 20% на бронирование партии медикаментов",
        amountSol: 4,
        percent: 20,
        status: "approved",
        budgetItems: [
          { id: "b201", name: "Предварительная оплата дистрибьютору", qty: 1, unit: "пакет", priceSol: 4 },
        ],
        reportHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        confidenceScore: 98,
        vendorName: "ТОО «МедФарм Астана»",
      },
      {
        id: "m-202",
        order: 2,
        title: "Транш 1 (40%): Закупка ортопедических корсетов (Спорный)",
        amountSol: 8,
        percent: 40,
        status: "submitted",
        budgetItems: [
          { id: "b202", name: "Корсет жесткой фиксации детск.", qty: 10, unit: "шт", priceSol: 0.8 },
        ],
        reportHash: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7",
        receiptName: "inv_medcor_9921_review.png",
        ocrTotal: 8.8,
        confidenceScore: 68,
        rejectionReason: "Завышение цены по позиции на 10%, размытый фискальный признак",
        vendorName: "ТОО «МедСнаб Трейд»",
      },
      {
        id: "m-203",
        order: 3,
        title: "Транш 2 (40%): Расходные материалы для физиотерапии",
        amountSol: 8,
        percent: 40,
        status: "pending",
        budgetItems: [
          { id: "b203", name: "Электроды и гели для физиотерапии", qty: 50, unit: "компл.", priceSol: 0.16 },
        ],
      },
    ],
  },
];

const initialHitl: HitlItem[] = [
  {
    id: "hitl-1",
    campaignId: "camp-2",
    milestoneId: "m-202",
    campaignTitle: "Медикаменты для детского реабилитационного центра",
    milestoneTitle: "Этап 2: Закупка индивидуальных ортопедических корсетов",
    fileName: "inv_medcor_9921_review.png",
    fileHashSha256: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7",
    vendorName: "ТОО «МедСнаб Трейд»",
    vendorBin: "180240039218",
    claimedAmountSol: 8.8,
    budgetAmountSol: 8.0,
    confidenceScore: 68,
    flags: [
      "Сумма превышает смету на 10% (8.8 SOL вместо 8.0 SOL)",
      "Размыт фискальный штамп ОФД в нижней части чека",
      "Поставщик отсутствует в основном Whitelist (требуется аккредитация)",
    ],
    ocrItems: [
      { name: "Корсет ортопедический коррегирующий р.S/M", qty: 10, priceSol: 0.88 },
    ],
    status: "pending",
    createdAt: "2026-10-07 18:24",
  },
];

const initialVendors: Vendor[] = [
  {
    id: "v-1",
    name: "ТОО «КазПолимер Строй»",
    bin: "210540023412",
    category: "Строительные и полимерные покрытия",
    walletAddress: "8vHqY7G4N5Z2B9pC3tK1oP6aM4dL7xY8rJ9sW0mN5tQ4",
    status: "whitelisted",
    completedOrdersCount: 14,
    totalPaidSol: 48.5,
    invoices: [
      {
        id: "inv-101",
        campaignId: "camp-1",
        campaignTitle: "Ремонт инклюзивной детской площадки",
        milestoneId: "m-102",
        milestoneTitle: "Этап 2: Закупка резиновой крошки и связующего",
        amountSol: 6.0,
        status: "pending_verification",
        invoiceNumber: "КПС-482/2026",
        date: "2026-10-06",
      },
    ],
  },
  {
    id: "v-2",
    name: "ТОО «МедФарм Астана»",
    bin: "190440019821",
    category: "Медицинское оборудование и препараты",
    walletAddress: "3mN8tQ7z8vHqY7G4N5Z2B9pC3tK1oP6aM4dL7xY8rJ9s",
    status: "whitelisted",
    completedOrdersCount: 29,
    totalPaidSol: 112.0,
    invoices: [
      {
        id: "inv-201",
        campaignId: "camp-2",
        campaignTitle: "Медикаменты для детского центра",
        milestoneId: "m-201",
        milestoneTitle: "Этап 1: Аванс на бронирование партии медикаментов",
        amountSol: 4.0,
        status: "paid",
        invoiceNumber: "МФА-1104",
        date: "2026-10-02",
      },
    ],
  },
  {
    id: "v-3",
    name: "ТОО «МедСнаб Трейд»",
    bin: "180240039218",
    category: "Медицинские изделия и ортопедия",
    walletAddress: "2bC3tK1oP6aM4dL7xY8rJ9sW0mN5tQ48vHqY7G4N5Z2",
    status: "pending",
    completedOrdersCount: 1,
    totalPaidSol: 0,
    invoices: [
      {
        id: "inv-301",
        campaignId: "camp-2",
        campaignTitle: "Медикаменты для детского реабилитационного центра",
        milestoneId: "m-202",
        milestoneTitle: "Этап 2: Закупка индивидуальных ортопедических корсетов",
        amountSol: 8.8,
        status: "pending_verification",
        invoiceNumber: "МСТ-9921",
        date: "2026-10-07",
      },
    ],
  },
];

const initialDonations: UserDonation[] = [
  {
    id: "don-init-1",
    campaignId: "camp-1",
    campaignTitle: "Ремонт инклюзивной детской площадки",
    amountSol: 0.5,
    timestamp: "07.10.2026, 14:10",
    signature: "5VERv8NMvzbJMEkV8xnrLkEaWrAxs9Jan...aidchain",
    explorerUrl: "https://explorer.solana.com/address/MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr?cluster=devnet",
    status: "escrowed",
  },
  {
    id: "don-init-2",
    campaignId: "camp-2",
    campaignTitle: "Медикаменты для детского реабилитационного центра",
    amountSol: 1.0,
    timestamp: "06.10.2026, 19:35",
    signature: "3jK8bV9xL2qY7aP4cM1oD5wR6tN8sE0u...aidchain",
    explorerUrl: "https://explorer.solana.com/address/MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr?cluster=devnet",
    status: "escrowed",
  },
];

const initialAuditRecords: AuditRecord[] = [
  {
    id: "rec-1",
    text: "[GENESIS] Протокол AidChain активирован в сети Solana",
    timestamp: "06.10.2026, 12:00:00",
    signature: "5VERv8NMvzbJMEkV8xnrLkEaWrAxs9Jan...aidchain",
    explorerUrl: "https://explorer.solana.com/address/MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr?cluster=devnet",
    status: "confirmed",
    role: "admin",
    category: "System",
  },
  {
    id: "rec-2",
    text: "[ESCROW CREATED] Кампания #1 «Ремонт детской площадки»: целевой смарт-контракт эскроу заблокирован на 15 SOL",
    timestamp: "06.10.2026, 14:22:15",
    signature: "3jK8bV9xL2qY7aP4cM1oD5wR6tN8sE0u...aidchain",
    explorerUrl: "https://explorer.solana.com/address/MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr?cluster=devnet",
    status: "confirmed",
    role: "foundation",
    category: "Escrow",
  },
  {
    id: "rec-3",
    text: "[AIDCHAIN DONATION] 1.00 SOL -> Медикаменты для детского реабилитационного центра",
    timestamp: "06.10.2026, 19:35:00",
    signature: "3jK8bV9xL2qY7aP4cM1oD5wR6tN8sE0u...aidchain",
    explorerUrl: "https://explorer.solana.com/address/MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr?cluster=devnet",
    status: "confirmed",
    role: "donor",
    category: "Donation",
  },
  {
    id: "rec-4",
    text: "[ADVANCE RELEASED] Выплата аванса 20% (3.00 SOL) подтверждена смарт-контрактом",
    timestamp: "07.10.2026, 10:15:40",
    signature: "4aP4cM1oD5wR6tN8sE0u3jK8bV9xL2qY...aidchain",
    explorerUrl: "https://explorer.solana.com/address/MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr?cluster=devnet",
    status: "confirmed",
    role: "foundation",
    category: "Payout",
  },
  {
    id: "rec-5",
    text: "[AIDCHAIN DONATION] 0.50 SOL -> Ремонт инклюзивной детской площадки",
    timestamp: "07.10.2026, 14:10:00",
    signature: "5VERv8NMvzbJMEkV8xnrLkEaWrAxs9Jan...aidchain",
    explorerUrl: "https://explorer.solana.com/address/MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr?cluster=devnet",
    status: "confirmed",
    role: "donor",
    category: "Donation",
  },
];

const AppStoreContext = createContext<AppStoreContextType | undefined>(undefined);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>("donor");
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [hitlQueue, setHitlQueue] = useState<HitlItem[]>(initialHitl);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [donations, setDonations] = useState<UserDonation[]>(initialDonations);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(initialAuditRecords);
  const [isInitialized, setIsInitialized] = useState(false);

  // Восстановление из LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.campaigns) setCampaigns(parsed.campaigns);
        if (parsed.hitlQueue) setHitlQueue(parsed.hitlQueue);
        if (parsed.vendors) setVendors(parsed.vendors);
        if (parsed.donations) setDonations(parsed.donations);
        if (parsed.auditRecords) setAuditRecords(parsed.auditRecords);
        if (parsed.currentRole) setCurrentRole(parsed.currentRole);
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
    setIsInitialized(true);
  }, []);

  // Сохранение в LocalStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          campaigns,
          hitlQueue,
          vendors,
          donations,
          auditRecords,
          currentRole,
        })
      );
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }, [campaigns, hitlQueue, vendors, donations, auditRecords, currentRole, isInitialized]);

  const addAuditRecord = (record: Omit<AuditRecord, "id">): AuditRecord => {
    const newRecord: AuditRecord = {
      ...record,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setAuditRecords((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const addDonation = (
    campaignId: string,
    amountSol: number,
    signature?: string,
    explorerUrl?: string
  ) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    const title = campaign ? campaign.title : "Кампания AidChain";

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, collectedAmountSol: +(c.collectedAmountSol + amountSol).toFixed(3) }
          : c
      )
    );

    const donation: UserDonation = {
      id: `don-${Date.now()}`,
      campaignId,
      campaignTitle: title,
      amountSol,
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      signature,
      explorerUrl,
      status: "escrowed",
    };
    setDonations((prev) => [donation, ...prev]);

    addAuditRecord({
      text: `[AIDCHAIN DONATION] ${amountSol} SOL -> ${title}`,
      timestamp: new Date().toLocaleString("ru-RU"),
      signature,
      explorerUrl:
        explorerUrl ||
        (signature
          ? `https://explorer.solana.com/tx/${signature}?cluster=devnet`
          : undefined),
      status: "confirmed",
      role: "donor",
      category: "Donation",
    });
  };

  const createCampaign = (
    newCampData: Omit<Campaign, "id" | "collectedAmountSol" | "status">,
    signature?: string,
    explorerUrl?: string
  ) => {
    const newCamp: Campaign = {
      ...newCampData,
      id: `camp-${Date.now()}`,
      collectedAmountSol: 0,
      status: "active",
    };
    setCampaigns((prev) => [newCamp, ...prev]);

    addAuditRecord({
      text: `[CAMPAIGN CREATED] Сбор «${newCamp.title}» с целью ${newCamp.targetAmountSol} SOL опубликован в эскроу`,
      timestamp: new Date().toLocaleString("ru-RU"),
      signature,
      explorerUrl,
      status: "confirmed",
      role: "foundation",
      category: "Campaign",
    });
  };

  const uploadReceipt = (
    campaignId: string,
    milestoneId: string,
    data: {
      fileName: string;
      fileHashSha256: string;
      vendorName: string;
      vendorBin: string;
      ocrTotal: number;
      confidenceScore: number;
      flags: string[];
      ocrItems: { name: string; qty: number; priceSol: number }[];
    }
  ) => {
    const isHitlNeeded = data.confidenceScore < 80 || data.flags.length > 0;

    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        return {
          ...c,
          milestones: c.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            return {
              ...m,
              status: "submitted",
              receiptName: data.fileName,
              reportHash: data.fileHashSha256,
              ocrTotal: data.ocrTotal,
              confidenceScore: data.confidenceScore,
              vendorName: data.vendorName,
            };
          }),
        };
      })
    );

    const camp = campaigns.find((c) => c.id === campaignId);
    const ms = camp?.milestones.find((m) => m.id === milestoneId);

    // Добавляем или связываем инвойс в реестре поставщика
    setVendors((prev) =>
      prev.map((v) => {
        if (v.name.toLowerCase().includes(data.vendorName.toLowerCase()) || v.id === "v-1") {
          const invoiceExists = v.invoices.some((inv) => inv.milestoneId === milestoneId);
          if (!invoiceExists) {
            return {
              ...v,
              invoices: [
                ...v.invoices,
                {
                  id: `inv-${Date.now()}`,
                  campaignId,
                  campaignTitle: camp?.title || "Кампания",
                  milestoneId,
                  milestoneTitle: ms?.title || "Этап",
                  amountSol: data.ocrTotal,
                  status: isHitlNeeded ? "pending_verification" : "pending_verification",
                  invoiceNumber: `СФ-${Math.floor(100 + Math.random() * 900)}/2026`,
                  date: new Date().toLocaleDateString("ru-RU"),
                },
              ],
            };
          }
        }
        return v;
      })
    );

    if (isHitlNeeded) {
      const newHitl: HitlItem = {
        id: `hitl-${Date.now()}`,
        campaignId,
        milestoneId,
        campaignTitle: camp?.title || "Кампания",
        milestoneTitle: ms?.title || "Этап",
        fileName: data.fileName,
        fileHashSha256: data.fileHashSha256,
        vendorName: data.vendorName,
        vendorBin: data.vendorBin,
        claimedAmountSol: data.ocrTotal,
        budgetAmountSol: ms?.amountSol || data.ocrTotal,
        confidenceScore: data.confidenceScore,
        flags: data.flags,
        ocrItems: data.ocrItems,
        status: "pending",
        createdAt: new Date().toLocaleString("ru-RU"),
      };
      setHitlQueue((prev) => [newHitl, ...prev]);
    }
  };

  const approveMilestone = (
    campaignId: string,
    milestoneId: string,
    signature?: string,
    explorerUrl?: string
  ) => {
    let releasedAmount = 0;
    let milestoneTitle = "";

    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        return {
          ...c,
          milestones: c.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            releasedAmount = m.amountSol;
            milestoneTitle = m.title;
            return {
              ...m,
              status: "approved",
            };
          }),
        };
      })
    );

    // Обновляем статус инвойса у поставщика
    setVendors((prev) =>
      prev.map((v) => ({
        ...v,
        invoices: v.invoices.map((inv) =>
          inv.milestoneId === milestoneId
            ? { ...inv, status: "pending_verification" }
            : inv
        ),
      }))
    );

    addAuditRecord({
      text: `[TRANCHE RELEASED] Транш ${releasedAmount} SOL разблокирован для этапа «${milestoneTitle}»`,
      timestamp: new Date().toLocaleString("ru-RU"),
      signature,
      explorerUrl,
      status: "confirmed",
      role: "foundation",
      category: "Escrow Release",
    });
  };

  const rejectMilestone = (
    campaignId: string,
    milestoneId: string,
    reason: string,
    signature?: string,
    explorerUrl?: string
  ) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        return {
          ...c,
          milestones: c.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            return {
              ...m,
              status: "rejected",
              rejectionReason: reason,
            };
          }),
        };
      })
    );

    addAuditRecord({
      text: `[REPORT REJECTED] Отчет по этапу отклонен оракулом: "${reason}"`,
      timestamp: new Date().toLocaleString("ru-RU"),
      signature,
      explorerUrl,
      status: "confirmed",
      role: "admin",
      category: "Rejection",
    });
  };

  const adminApproveHitl = (
    hitlId: string,
    signature?: string,
    explorerUrl?: string
  ) => {
    const item = hitlQueue.find((h) => h.id === hitlId);
    if (!item) return;

    setHitlQueue((prev) =>
      prev.map((h) => (h.id === hitlId ? { ...h, status: "approved" } : h))
    );

    approveMilestone(item.campaignId, item.milestoneId, signature, explorerUrl);

    addAuditRecord({
      text: `[HITL OVERRIDE APPROVED] Администратор вручную одобрил спорный чек ${item.fileName} (${item.claimedAmountSol} SOL)`,
      timestamp: new Date().toLocaleString("ru-RU"),
      signature,
      explorerUrl,
      status: "confirmed",
      role: "admin",
      category: "HITL Resolution",
    });
  };

  const adminRejectHitl = (
    hitlId: string,
    reason: string,
    signature?: string,
    explorerUrl?: string
  ) => {
    const item = hitlQueue.find((h) => h.id === hitlId);
    if (!item) return;

    setHitlQueue((prev) =>
      prev.map((h) => (h.id === hitlId ? { ...h, status: "rejected" } : h))
    );

    rejectMilestone(item.campaignId, item.milestoneId, reason, signature, explorerUrl);
  };

  const toggleVendorWhitelist = (vendorId: string) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== vendorId) return v;
        const newStatus = v.status === "whitelisted" ? "pending" : "whitelisted";
        return { ...v, status: newStatus };
      })
    );
  };

  const claimVendorPayout = (
    vendorId: string,
    invoiceId: string,
    signature?: string,
    explorerUrl?: string
  ) => {
    const targetVendor = vendors.find((v) => v.id === vendorId);
    const targetInvoice = targetVendor?.invoices.find((inv) => inv.id === invoiceId);
    const invoiceAmount = targetInvoice?.amountSol || 0;
    const invNumber = targetInvoice?.invoiceNumber || "СФ";

    // Корректное обновление суммы с предварительно вычисленным значением
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== vendorId) return v;
        return {
          ...v,
          totalPaidSol: +(v.totalPaidSol + invoiceAmount).toFixed(3),
          invoices: v.invoices.map((inv) =>
            inv.id === invoiceId ? { ...inv, status: "paid" } : inv
          ),
        };
      })
    );

    addAuditRecord({
      text: `[DIRECT VENDOR PAYOUT] Прямая выплата из эскроу поставщику по счёту #${invNumber} на сумму ${invoiceAmount} SOL`,
      timestamp: new Date().toLocaleString("ru-RU"),
      signature,
      explorerUrl,
      status: "confirmed",
      role: "vendor",
      category: "Direct Payout",
    });
  };

  const requestRefund = (
    donationId: string,
    campaignId: string,
    refundAmountSol: number,
    signature?: string,
    explorerUrl?: string
  ) => {
    // 1. Помечаем пожертвование как refunded
    setDonations((prev) =>
      prev.map((d) =>
        d.id === donationId
          ? { ...d, status: "refunded", refundAmountSol }
          : d
      )
    );

    // 2. Уменьшаем сумму в кампании
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, collectedAmountSol: Math.max(0, +(c.collectedAmountSol - refundAmountSol).toFixed(3)) }
          : c
      )
    );

    addAuditRecord({
      text: `[REFUND EXECUTED] Донору возвращена пропорциональная доля ${refundAmountSol} SOL из неиспользованного остатка эскроу`,
      timestamp: new Date().toLocaleString("ru-RU"),
      signature,
      explorerUrl,
      status: "confirmed",
      role: "donor",
      category: "Refund",
    });
  };

  const resetToDefaults = () => {
    setCampaigns(initialCampaigns);
    setHitlQueue(initialHitl);
    setVendors(initialVendors);
    setDonations(initialDonations);
    setAuditRecords(initialAuditRecords);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AppStoreContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        campaigns,
        hitlQueue,
        vendors,
        donations,
        auditRecords,
        addAuditRecord,
        addDonation,
        createCampaign,
        uploadReceipt,
        approveMilestone,
        rejectMilestone,
        adminApproveHitl,
        adminRejectHitl,
        toggleVendorWhitelist,
        claimVendorPayout,
        requestRefund,
        resetToDefaults,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within an AppStoreProvider");
  }
  return context;
}
