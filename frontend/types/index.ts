// AIDCHAIN — Proof of Aid Types

export type MilestoneStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';
export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type UserRole = 'donor' | 'ngo' | 'supplier' | 'distributor' | 'admin';

export type SupplyChainStage = 'donor' | 'ngo' | 'supplier' | 'distributor' | 'beneficiary';
export type StageType = 'procurement' | 'distribution' | 'reporting';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  organization?: string;
  walletAddress?: string;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category?: string;
}

export interface SupplyChainStepInfo {
  stage: SupplyChainStage;
  label: string;
  actorName: string;
  actorRole: string;
  status: 'completed' | 'active' | 'pending';
  txHash?: string;
  proofHash?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface Milestone {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  targetAmount: number;
  releasedAmount: number;
  status: MilestoneStatus;
  stageType: StageType;
  deadline: string;
  budgetItems: BudgetItem[];
  beneficiaryCount?: number;
  receiptUrl?: string;
  receiptHash?: string;
  aiValidationResult?: AIValidationResult;
  adminComment?: string;
  txHash?: string;
  order: number;
}

export interface AIValidationResult {
  isValid: boolean;
  verdict: 'approved' | 'rejected' | 'needs_review';
  confidence: number;
  fraudScore: number;
  vendorName?: string;
  vendorBin?: string;
  detectedAmount?: number;
  detectedDate?: string;
  isFiscal: boolean;
  issues: string[];
  reasons: string[];
  oracleSignature?: string;
}

export interface Organizer {
  id: string;
  name: string;
  verified: boolean;
  registrationNumber?: string;
  country: string;
  missionType: string;
  avatar?: string;
}

export interface ImpactMetrics {
  beneficiariesTarget: number;
  beneficiariesReached: number;
  goodsDeliveredQuantity: number;
  goodsUnit: string;
  region: string;
  emergencyLevel: 'Critical' | 'High' | 'Medium';
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  organizer: Organizer;
  status: CampaignStatus;
  category: string;
  targetAmount: number;
  collectedAmount: number;
  releasedAmount: number;
  currency: string;
  coverImage: string;
  gallery: string[];
  startDate: string;
  endDate: string;
  milestones: Milestone[];
  supplyChain: SupplyChainStepInfo[];
  impact: ImpactMetrics;
  contractAddress: string;
  txHash?: string;
  donationsCount: number;
}

export interface Donation {
  id: string;
  campaignId: string;
  campaignTitle?: string;
  donorName: string;
  amount: number;
  currency: string;
  txHash: string;
  createdAt: string;
  allocatedStage?: string;
  beneficiariesSupported?: number;
}

export interface AuditEvent {
  id: string;
  campaignId: string;
  stage: SupplyChainStage;
  event: string;
  description: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  proofHash?: string;
  verifiedBy: 'AI Oracle' | 'Smart Contract' | 'Admin';
}
