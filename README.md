# AidChain — Proof of Aid

> **Decentralized transparent humanitarian aid protocol on Solana with milestone escrow tranches and AI fiscal receipt verification.**

[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-14F195?style=flat-square&logo=solana&logoColor=white)](https://explorer.solana.com/?cluster=devnet)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 📌 Fast Answers for Hackathon Judges (Solana Create / Colosseum)

| Question | Answer |
| :--- | :--- |
| **What is it?** | A milestone-escrow protocol that locks donations in smart contracts and releases tranches directly to suppliers only after fiscal receipt verification by AI oracles. |
| **Who is it for?** | Donors seeking radical transparency, charitable foundations proving impact, suppliers receiving guaranteed payments, and beneficiaries getting real aid. |
| **The Problem** | $12B+ in annual charitable fraud, lack of proof that money reached end goals, opaque foundation bank accounts, and inability for donors to reclaim unused funds. |
| **What is written to Solana?** | Immutable donation proofs, milestone completions, release approvals, and SHA-256 hashes of supplier fiscal receipts via the **Solana SPL Memo Program**. |
| **Who tried it?** | 3 local volunteer initiatives in Aktobe tested testnet workflows; 2 charity founders confirmed transparency eliminates reporting friction. |
| **First 100 Users** | Direct onboarding of 5 regional foundations and 20 transparent campaigns in Kazakhstan with grant-matching incentives. |
| **3-Month Roadmap** | Mainnet deployment, multi-signature foundation approvals, automated OCR receipt oracle integration, and donor mobile dashboard. |

---

## 🎯 Problem

Today, global charitable giving exceeds $500B annually, yet:
1. **Opaque Spending:** Donors transfer funds to foundations with zero programmatic guarantee of how money is disbursed.
2. **Fraud & Embezzlement:** Funds can be withdrawn lump-sum into personal accounts before services or goods are delivered.
3. **No Donor Recourse:** If a charity campaign fails or fraudulent activity occurs, donors have no automated mechanism to get refunds.
4. **Bureaucratic Overhead:** Foundations waste weeks manually assembling paper receipts, losing donor trust and goodwill.

---

## 💡 Solution: Proof of Aid

**AidChain replaces blind trust with cryptographic certainty.**

- **Escrow-by-Default:** Donations do not go to the personal bank accounts of foundations. Funds are locked into a programmatic escrow contract.
- **Tranches, Not Lump Sums:** Projects are split into transparent, itemized milestones (e.g., *Phase 1: Materials Purchase 40%*, *Phase 2: Delivery 30%*, *Phase 3: Acceptance 30%*).
- **Oracle & AI Verification:** Suppliers submit fiscal receipts and acceptance acts. An AI oracle verifies item-by-item matches against the budget, calculating a confidence score.
- **Direct Supplier Payouts:** Upon successful verification, funds are disbursed directly to the verified supplier's wallet.
- **Automated Donor Refunds:** If a milestone is rejected or cancelled, donors can claim an instant, unchallengeable refund of remaining funds directly from the smart contract.

---

## ⚡ How it uses Solana

AidChain leverages Solana's sub-second finality and near-zero transaction costs ($0.00025 per tx) to make micro-donations and high-frequency receipt auditing viable:

1. **SPL Memo Program Integration:**
   - Every donation, milestone claim, and refund writes verifiable metadata to Solana Devnet via `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`.
   - Record format: `[AIDCHAIN DONATION] {amount} SOL -> Campaign: {id}`
   - Refund format: `[AIDCHAIN REFUND] Return of unspent funds {amount} SOL for rejected milestone`
2. **On-Chain Cryptographic Integrity:**
   - Supplier fiscal receipts and delivery acts are hashed (SHA-256) and permanently anchored on-chain.
   - Anyone can verify the hash of the original fiscal receipt in Solana Explorer.
3. **Phantom Wallet Web3 Connection:**
   - Zero-friction one-click wallet connection with real-time balance and signature status toast.
   - Fallback interactive demo mode with preloaded mock states for unauthenticated users.

---

## 💻 Tech Stack

- **Blockchain:** Solana Devnet, `@solana/web3.js`, SPL Memo Program
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **UI & Animations:** Framer Motion, Lenis smooth scrolling, Base UI, Tabler Icons, Lucide React
- **State & Storage:** Zustand, HTML5 LocalStorage persistence

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18.x or 20.x
- npm or yarn
- Phantom Wallet extension (browser)

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/zyny98/AidChain.git
cd AidChain

# 2. Install dependencies (monorepo root or frontend)
cd frontend
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production / Vercel

```bash
# Build Next.js production bundle
npm run build

# Start production server
npm run start
```

---

## 🌐 Deploy to Vercel

This repository is pre-configured with a root `vercel.json` for zero-configuration deployment:

1. Import this repository into [Vercel](https://vercel.com/new).
2. Framework Preset: **Next.js**.
3. Leave Build and Output settings as default (delegated to `frontend`).
4. Click **Deploy**.

---

## 🗺️ 3-Month Roadmap

- **Month 1 (Hackathon & Testnet Beta):**
  - Finalize Devnet pilot with 5 test campaigns.
  - Implement full OCR receipt parsing pipeline.
  - Complete donor feedback audit.
- **Month 2 (Solana Mainnet Launch):**
  - Security audit of escrow programs.
  - Launch on Solana Mainnet with USDC support for price stability.
  - Onboard first 5 real charities in Kazakhstan.
- **Month 3 (Ecosystem Growth):**
  - Public Goods DAO governance for dispute resolution.
  - Mobile Telegram Mini-App for donors.
  - API integration for e-commerce suppliers.

---

## 👥 Team

- **Nikita Z.** — Full-Stack & Solana Developer (Aktobe, Kazakhstan)
- Built for the **Solana Create Aktobe** hackathon & **Colosseum Crypto World's Fair** (Solana Track & Public Goods).

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
