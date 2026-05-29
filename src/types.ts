/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HardwareTier = 'Core' | 'Aurora' | 'Supercluster' | 'Hypernode' | 'Quantum';

export interface InvestmentProduct {
  id: string;
  name: string;
  codename: string;
  description: string;
  tier: HardwareTier;
  cost: number; // R$
  dailyYieldPercent: number; // e.g. 2.4%
  dailyYieldAmount: number; // R$
  efficiency: string; // e.g., 98.4%
  hashrate: string; // GH/s or TH/s
  powerConsumption: number; // Watts
  visualColor: string; // Tailwind glow border color, e.g. 'indigo', 'cyan', 'emerald'
  imageUrl: string;
}

export interface UserRig {
  id: string;
  productId: string;
  name: string;
  codename: string;
  purchaseTimestamp: number;
  lastClaimedTimestamp: number;
  accumulatedMinutes: number; // Track simulated time elapsed
  tier: HardwareTier;
  cost: number;
  dailyYieldPercent: number;
  dailyYieldAmount: number;
  visualColor: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'buy_hardware' | 'claim_yield' | 'referral_bonus' | 'checkin_bonus';
  amount: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  details?: string;
}

export interface ReferralPilot {
  id: string;
  username: string;
  avatarUrl: string;
  joinedAt: number;
  investmentAmount: number;
  commissionEarned: number;
}
