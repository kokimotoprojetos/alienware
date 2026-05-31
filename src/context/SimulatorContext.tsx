/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { InvestmentProduct, UserRig, Transaction, ReferralPilot } from '../types';
import { INITIAL_PRODUCTS, INITIAL_MISSIONS, COMMISSIONS } from '../data';
import { supabase } from '../lib/supabase';

interface SimulatorContextType {
  user: { id: string; phone_or_email: string } | null;
  balance: number;
  balanceInvested: number;
  userRigs: UserRig[];
  unclaimedYield: number;
  transactions: Transaction[];
  referrals: ReferralPilot[];
  completedMissions: string[];
  simulationSpeed: number; // multiplier: 1, 60, 3600, 86400
  simulationTimeElapsed: number; // accumulated simulated seconds
  checkInClaimedToday: boolean;
  login: (phoneOrEmail: string, passwordRequired: string) => Promise<boolean>;
  register: (phoneOrEmail: string, passwordRequired: string) => Promise<boolean>;
  logout: () => void;
  buyHardware: (productId: string) => boolean;
  sellHardware: (userRigId: string) => void;
  claimYield: () => void;
  claimIndividualYield: (userRigId: string) => void;
  depositFunds: (amount: number) => void;
  withdrawFunds: (amount: number, pixKey: string) => Promise<{ success: boolean; message: string }>;
  toggleSpeed: () => void;
  claimCheckIn: () => void;
  claimMissionReward: (missionId: string) => void;
  addMockReferral: () => void;
  resetAllSimulation: () => void;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
};

export const SimulatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session state
  const [user, setUser] = useState<{ id: string; phone_or_email: string } | null>(null);

  // States
  const [balance, setBalance] = useState<number>(0.00);
  const [userRigs, setUserRigs] = useState<UserRig[]>([]);
  const [unclaimedYield, setUnclaimedYield] = useState<number>(0.00);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referrals, setReferrals] = useState<ReferralPilot[]>([]);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [simulationSpeed] = useState<number>(1); // Locked to 1x (real time) for live operations
  const [simulationTimeElapsed, setSimulationTimeElapsed] = useState<number>(0);
  const [checkInClaimedToday, setCheckInClaimedToday] = useState<boolean>(false);

  // Calculate dynamic invested balance
  const balanceInvested = userRigs.reduce((acc, curr) => acc + curr.cost, 0);

  // References for ticker loop
  const speedRef = useRef(simulationSpeed);
  speedRef.current = simulationSpeed;

  const userRigsRef = useRef(userRigs);
  userRigsRef.current = userRigs;

  // Helper to parse arrays safely even if they come back from Supabase as raw strings or null
  const safeParseArray = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('[Supabase Safety] Failed to parse stringified JSON column:', e);
      }
    }
    return [];
  };

  // Helper to generate a deterministic 6-digit referral code based on profile attributes
  const getReferralCode = (u: any) => {
    if (!u) return '';
    let hash = 0;
    const str = u.id || u.phone_or_email || '';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash % 900000) + 100000).toString();
  };

  // Helper: today's date as YYYY-MM-DD string
  const todayDateStr = () => new Date().toISOString().split('T')[0];

  // Helper to process offline yield and auto-claim after midnight
  const processOfflineYield = (
    currentBalance: number,
    currentRigs: UserRig[],
    currentTransactions: Transaction[],
    userId: string
  ) => {
    if (!currentRigs || currentRigs.length === 0) {
      setBalance(currentBalance);
      setUserRigs(currentRigs);
      setTransactions(currentTransactions);
      return;
    }

    let totalEarned = 0;
    const now = Date.now();
    const todayStr = new Date(now).toLocaleDateString('pt-BR');

    const updatedRigs = currentRigs.map(rig => {
      const lastClaim = rig.lastClaimedTimestamp || rig.purchaseTimestamp;
      const lastClaimStr = new Date(lastClaim).toLocaleDateString('pt-BR');
      
      // Calculate elapsed time
      const elapsedMs = now - lastClaim;
      if (elapsedMs <= 0) return rig;

      const dailyYield = rig.dailyYieldAmount;
      const earned = (dailyYield / 86400000) * elapsedMs;
      
      // Auto-claim only if date has changed (past midnight)
      if (lastClaimStr !== todayStr) {
        totalEarned += earned;
        return {
          ...rig,
          lastClaimedTimestamp: now,
          accumulatedMinutes: 0
        };
      }
      return rig;
    });

    if (totalEarned > 0.01) {
      const newBalance = currentBalance + totalEarned;
      const newTx: Transaction = {
        id: `tx-autoclaim-${now}`,
        type: 'claim_yield',
        amount: totalEarned,
        timestamp: now,
        status: 'completed',
        details: `Rendimento creditado automaticamente pós-meia-noite`
      };
      const newTxs = [newTx, ...currentTransactions];

      setBalance(newBalance);
      setUserRigs(updatedRigs);
      setTransactions(newTxs);

      if (supabase) {
        supabase
          .from('profiles')
          .update({
            balance: newBalance,
            user_rigs: updatedRigs,
            transactions: newTxs
          })
          .eq('id', userId)
          .then(() => {});
      }
    } else {
      setBalance(currentBalance);
      setUserRigs(updatedRigs);
      setTransactions(currentTransactions);
    }
  };

  // Load session from localStorage on mount & sync with Supabase
  useEffect(() => {
    if (!supabase) {
      console.warn('[Supabase Client] Não inicializado. Pulando carregamento automático.');
      return;
    }
    const stored = localStorage.getItem('aw_logged_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', parsed.id)
            .single()
            .then(({ data, error }) => {
              if (data && !error) {
                setUser({ id: data.id, phone_or_email: data.phone_or_email });
                setReferrals(safeParseArray(data.referrals));
                setCompletedMissions(safeParseArray(data.completed_missions));

                // Process offline yields and set user rigs/balance/txs
                processOfflineYield(
                  Number(data.balance),
                  safeParseArray(data.user_rigs),
                  safeParseArray(data.transactions),
                  data.id
                );

                // BUG FIX #5: Auto-reset check-in if stored date != today
                const storedCheckinDate = data.last_checkin_date || null;
                const isNewDay = storedCheckinDate !== todayDateStr();
                if (isNewDay && data.checkin_claimed_today) {
                  setCheckInClaimedToday(false);
                  // Reset in DB silently
                  supabase
                    .from('profiles')
                    .update({ checkin_claimed_today: false, last_checkin_date: null })
                    .eq('id', data.id)
                    .then(() => {});
                } else {
                  setCheckInClaimedToday(data.checkin_claimed_today || false);
                }
              } else {
                logout();
              }
            });
        }
      } catch (e) {
        console.error('Failed to parse logged user:', e);
      }
    }
  }, []);

  // Sync state to Supabase when it changes (debounce 15s to reduce write pressure)
  useEffect(() => {
    if (!user || !supabase) return;

    const syncData = async () => {
      try {
        await supabase
          .from('profiles')
          .update({
            balance,
            user_rigs: userRigs,
            transactions,
            referrals,
            completed_missions: completedMissions,
            checkin_claimed_today: checkInClaimedToday
          })
          .eq('id', user.id);
      } catch (e) {
        console.error('Failed to sync data with Supabase:', e);
      }
    };

    const timeout = setTimeout(syncData, 15000); // BUG FIX #8: increased from 1s to 15s
    return () => clearTimeout(timeout);
  }, [balance, userRigs, transactions, referrals, completedMissions, checkInClaimedToday, user]);

  // Auth Functions — SEC FIX #1: use secure API route with bcryptjs
  const login = async (phoneOrEmail: string, passwordRequired: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail, password: passwordRequired })
      });

      const data = await response.json();
      if (!response.ok || !data.success) return false;

      setUser(data.user);
      setReferrals(safeParseArray(data.profile.referrals));
      setCompletedMissions(safeParseArray(data.profile.completed_missions));

      // Process offline yields on login
      processOfflineYield(
        Number(data.profile.balance),
        safeParseArray(data.profile.user_rigs),
        safeParseArray(data.profile.transactions),
        data.user.id
      );

      // BUG FIX #5: Check-in date validation on login
      const storedCheckinDate = data.profile.last_checkin_date || null;
      const isNewDay = storedCheckinDate !== todayDateStr();
      setCheckInClaimedToday(isNewDay ? false : (data.profile.checkin_claimed_today || false));

      localStorage.setItem('aw_logged_user', JSON.stringify({ id: data.user.id, phone_or_email: data.user.phone_or_email }));
      localStorage.setItem('aw_session_token', data.sessionToken);
      return true;
    } catch (e) {
      console.error('[Login] Error:', e);
      return false;
    }
  };

  // SEC FIX #1: register now uses secure API route with bcryptjs password hashing
  const register = async (phoneOrEmail: string, passwordRequired: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail, password: passwordRequired })
      });

      const data = await response.json();
      if (!response.ok || !data.success) return false;

      setUser(data.user);
      setBalance(0.00);
      setUserRigs([]);
      setTransactions([]);
      setReferrals([]);
      setCompletedMissions([]);
      setCheckInClaimedToday(false);

      localStorage.setItem('aw_logged_user', JSON.stringify({ id: data.user.id, phone_or_email: data.user.phone_or_email }));
      localStorage.setItem('aw_session_token', data.sessionToken);

      // Process referral signup bonus if referrer code exists
      if (supabase) {
        const referrerCode = localStorage.getItem('aw_referrer');
        if (referrerCode && referrerCode !== getReferralCode(data.user)) {
          try {
            const { data: allProfiles } = await supabase
              .from('profiles')
              .select('*');

            if (allProfiles) {
              const referrerData = allProfiles.find((p: any) => getReferralCode(p) === referrerCode);

              if (referrerData) {
                const refs = safeParseArray(referrerData.referrals);
                if (!refs.some((r: any) => r.username === phoneOrEmail.split('@')[0])) {
                  const newReferralItem = {
                    id: data.user.id,
                    username: phoneOrEmail.split('@')[0],
                    avatarUrl: ['👽', '👾', '🤖', '👑', '🚀'][Math.floor(Math.random() * 5)],
                    joinedAt: Date.now(),
                    investmentAmount: 0,
                    commissionEarned: 0
                  };
                  const updatedRefs = [...refs, newReferralItem];
                  const referralBonus = 5.00;
                  const updatedBalance = Number(referrerData.balance) + referralBonus;

                  const tx: Transaction = {
                    id: `tx-${Date.now()}`,
                    type: 'referral_bonus',
                    amount: referralBonus,
                    timestamp: Date.now(),
                    status: 'completed',
                    details: `Bônus de Indicação Co-piloto (${phoneOrEmail.split('@')[0]})`
                  };
                  const updatedTxs = [tx, ...safeParseArray(referrerData.transactions)];

                  await supabase
                    .from('profiles')
                    .update({
                      referrals: updatedRefs,
                      balance: updatedBalance,
                      transactions: updatedTxs
                    })
                    .eq('id', referrerData.id);
                }
              }
            }
          } catch (refError) {
            console.error('[Supabase Referral Signup] Failed to record signup bonus:', refError);
          }
        }
      }

      return true;
    } catch (e) {
      console.error('[Register] Error:', e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aw_logged_user');
    localStorage.removeItem('aw_session_token'); // SEC FIX: clear session token on logout
    setBalance(0.00);
    setUserRigs([]);
    setTransactions([]);
    setReferrals([]);
    setCompletedMissions([]);
    setCheckInClaimedToday(false);
    setUnclaimedYield(0);
  };

  // Core Simulation Loop using interval
  useEffect(() => {
    const tickInterval = 1000; // Tick every 1s
    let lastDateStr = new Date().toLocaleDateString('pt-BR');
    
    const interval = setInterval(() => {
      const simSecondsPassed = speedRef.current;
      setSimulationTimeElapsed(prev => prev + simSecondsPassed);

      if (userRigsRef.current.length === 0) return;

      // Midnight auto-claim check
      const currentDateStr = new Date().toLocaleDateString('pt-BR');
      if (currentDateStr !== lastDateStr) {
        lastDateStr = currentDateStr;
        
        // Auto-claim all unclaimed yield to balance
        setUnclaimedYield(unclaimed => {
          if (unclaimed > 0.01) {
            setBalance(prev => prev + unclaimed);
            const now = Date.now();
            const tx: Transaction = {
              id: `tx-midnight-${now}`,
              type: 'claim_yield',
              amount: unclaimed,
              timestamp: now,
              status: 'completed',
              details: `Rendimento creditado automaticamente pós-meia-noite (Online)`
            };
            setTransactions(prev => [tx, ...prev]);
            setUserRigs(prevRigs => 
              prevRigs.map(rig => ({
                ...rig,
                lastClaimedTimestamp: now,
                accumulatedMinutes: 0
              }))
            );
          }
          return 0;
        });
      }

      let totalTickYield = 0;
      setUserRigs(prevRigs => 
        prevRigs.map(rig => {
          const dailyYield = rig.dailyYieldAmount;
          const earnedOnTick = (dailyYield / 86400) * simSecondsPassed;
          totalTickYield += earnedOnTick;
          
          return {
            ...rig,
            accumulatedMinutes: rig.accumulatedMinutes + (simSecondsPassed / 60)
          };
        })
      );

      setUnclaimedYield(prev => prev + totalTickYield);
    }, tickInterval);

    return () => clearInterval(interval);
  }, []);

  // Buy Hardware logic
  const buyHardware = (productId: string): boolean => {
    const product = INITIAL_PRODUCTS.find(p => p.id === productId);
    if (!product) return false;
    if (balance < product.cost) return false;

    setBalance(prev => prev - product.cost);

    const newRig: UserRig = {
      id: `rig-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      name: product.name,
      codename: product.codename,
      purchaseTimestamp: Date.now(),
      lastClaimedTimestamp: Date.now(),
      accumulatedMinutes: 0,
      tier: product.tier,
      cost: product.cost,
      dailyYieldPercent: product.dailyYieldPercent,
      dailyYieldAmount: product.dailyYieldAmount,
      visualColor: product.visualColor
    };

    setUserRigs(prev => [...prev, newRig]);

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'buy_hardware',
      amount: product.cost,
      timestamp: Date.now(),
      status: 'completed',
      details: `Ativado Nó ${product.name} (${product.codename})`
    };
    setTransactions(prev => [tx, ...prev]);

    // Pay commissions up to 3 levels to referrers if they exist in the database
    if (supabase && user) {
      (async () => {
        try {
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('id, referrals, balance, transactions');

          if (allProfiles) {
            // Find Level 1 referrer (direct referrer of the current user)
            const referrerL1 = allProfiles.find(p => {
              const refs = safeParseArray(p.referrals);
              return refs.some(r => r.id === user.id);
            });

            if (referrerL1) {
              // 1. Pay Level 1 commission
              const refsL1 = safeParseArray(referrerL1.referrals);
              const updatedRefsL1 = refsL1.map(r => {
                if (r.id === user.id) {
                  const updatedInvest = Number(r.investmentAmount) + product.cost;
                  const commission = product.cost * COMMISSIONS.level1;
                  const updatedComm = Number(r.commissionEarned) + commission;
                  return {
                    ...r,
                    investmentAmount: updatedInvest,
                    commissionEarned: updatedComm
                  };
                }
                return r;
              });

              const commissionAmountL1 = product.cost * COMMISSIONS.level1;
              const referrerL1NewBalance = Number(referrerL1.balance) + commissionAmountL1;

              const commissionTxL1: Transaction = {
                id: `tx-l1-${Date.now()}`,
                type: 'referral_bonus',
                amount: commissionAmountL1,
                timestamp: Date.now(),
                status: 'completed',
                details: `Comissão Nível 1: Compra de ${product.name} por Co-piloto`
              };
              const referrerL1NewTxs = [commissionTxL1, ...safeParseArray(referrerL1.transactions)];

              await supabase
                .from('profiles')
                .update({
                  referrals: updatedRefsL1,
                  balance: referrerL1NewBalance,
                  transactions: referrerL1NewTxs
                })
                .eq('id', referrerL1.id);

              // Find Level 2 referrer (referrer of referrerL1)
              const referrerL2 = allProfiles.find(p => {
                const refs = safeParseArray(p.referrals);
                return refs.some(r => r.id === referrerL1.id);
              });

              if (referrerL2) {
                // 2. Pay Level 2 commission
                const commissionAmountL2 = product.cost * COMMISSIONS.level2;
                const referrerL2NewBalance = Number(referrerL2.balance) + commissionAmountL2;

                const commissionTxL2: Transaction = {
                  id: `tx-l2-${Date.now()}`,
                  type: 'referral_bonus',
                  amount: commissionAmountL2,
                  timestamp: Date.now() + 1,
                  status: 'completed',
                  details: `Comissão Nível 2: Compra de ${product.name} na Rede`
                };
                const referrerL2NewTxs = [commissionTxL2, ...safeParseArray(referrerL2.transactions)];

                await supabase
                  .from('profiles')
                  .update({
                    balance: referrerL2NewBalance,
                    transactions: referrerL2NewTxs
                  })
                  .eq('id', referrerL2.id);

                // Find Level 3 referrer (referrer of referrerL2)
                const referrerL3 = allProfiles.find(p => {
                  const refs = safeParseArray(p.referrals);
                  return refs.some(r => r.id === referrerL2.id);
                });

                if (referrerL3) {
                  // 3. Pay Level 3 commission
                  const commissionAmountL3 = product.cost * COMMISSIONS.level3;
                  const referrerL3NewBalance = Number(referrerL3.balance) + commissionAmountL3;

                  const commissionTxL3: Transaction = {
                    id: `tx-l3-${Date.now()}`,
                    type: 'referral_bonus',
                    amount: commissionAmountL3,
                    timestamp: Date.now() + 2,
                    status: 'completed',
                    details: `Comissão Nível 3: Compra de ${product.name} na Rede`
                  };
                  const referrerL3NewTxs = [commissionTxL3, ...safeParseArray(referrerL3.transactions)];

                  await supabase
                    .from('profiles')
                    .update({
                      balance: referrerL3NewBalance,
                      transactions: referrerL3NewTxs
                    })
                    .eq('id', referrerL3.id);
                }
              }
            }
          }
        } catch (refError) {
          console.error('[Supabase Referral Purchase] Commission payment failed:', refError);
        }
      })();
    }


    return true;
  };

  // Sell Hardware back (at 70% buyback rate)
  const sellHardware = (userRigId: string) => {
    const rig = userRigs.find(r => r.id === userRigId);
    if (!rig) return;

    const refundAmount = rig.cost * 0.70;

    // BUG FIX #4: subtract this rig's accumulated yield from global unclaimedYield
    // to prevent collecting yield from a rig that was already sold
    const rigAccumulatedYield = (rig.dailyYieldAmount / 1440) * rig.accumulatedMinutes;
    setUnclaimedYield(prev => Math.max(0, prev - rigAccumulatedYield));

    setUserRigs(prev => prev.filter(r => r.id !== userRigId));
    setBalance(prev => prev + refundAmount);

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'withdraw',
      amount: refundAmount,
      timestamp: Date.now(),
      status: 'completed',
      details: `Reembolso de Desativação (${rig.name}): Reciclagem 70%`
    };
    setTransactions(prev => [tx, ...prev]);
  };

  // Collect All Yield
  const claimYield = () => {
    if (unclaimedYield <= 0.01) return;

    const claimed = unclaimedYield;
    setBalance(prev => prev + claimed);
    setUnclaimedYield(0);

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'claim_yield',
      amount: claimed,
      timestamp: Date.now(),
      status: 'completed',
      details: `Coleta total de rendimentos de mineração em nuvem`
    };
    setTransactions(prev => [tx, ...prev]);

    setUserRigs(prev => 
      prev.map(rig => ({
        ...rig,
        lastClaimedTimestamp: Date.now(),
        accumulatedMinutes: 0
      }))
    );
  };

  // Collect Individual Rig Yield
  const claimIndividualYield = (userRigId: string) => {
    const rig = userRigs.find(r => r.id === userRigId);
    if (!rig) return;

    const accumulatedMins = rig.accumulatedMinutes;
    if (accumulatedMins <= 0.5) return;

    const individualEarned = (rig.dailyYieldAmount / 1440) * accumulatedMins;
    
    setBalance(prev => prev + individualEarned);
    setUnclaimedYield(prev => Math.max(0, prev - individualEarned));

    setUserRigs(prev => 
      prev.map(r => r.id === userRigId ? {
        ...r, 
        lastClaimedTimestamp: Date.now(), 
        accumulatedMinutes: 0
      } : r)
    );

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'claim_yield',
      amount: individualEarned,
      timestamp: Date.now(),
      status: 'completed',
      details: `Coleta de Rendimentos - ${rig.name}`
    };
    setTransactions(prev => [tx, ...prev]);
  };

  // Deposit funds (real PIX callbacks update balance via this call)
  const depositFunds = (amount: number) => {
    const hasCompletedDeposit = transactions.some(t => t.type === 'deposit' && t.status === 'completed');
    const bonus = !hasCompletedDeposit ? 5.00 : 0;

    setBalance(prev => prev + amount + bonus);

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      amount: amount,
      timestamp: Date.now(),
      status: 'completed',
      details: 'Depósito PIX Recarregado'
    };

    if (bonus > 0) {
      const bonusTx: Transaction = {
        id: `tx-bonus-${Date.now()}`,
        type: 'referral_bonus',
        amount: bonus,
        timestamp: Date.now() + 10,
        status: 'completed',
        details: 'Bônus de Primeiro Depósito!'
      };
      setTransactions(prev => [bonusTx, tx, ...prev]);
    } else {
      setTransactions(prev => [tx, ...prev]);
    }
  };

  // Withdraw funds via backend integration
  const withdrawFunds = async (amount: number, pixKey: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Sessão inválida. Por favor, realize o login novamente.' };
    }
    if (amount < 30.00) {
      return { success: false, message: 'O valor mínimo para saque é de R$ 30,00.' };
    }
    if (amount > balance) {
      return { success: false, message: 'Saldo insuficiente para esta transação.' };
    }

    const sessionToken = localStorage.getItem('aw_session_token') || '';

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken, // SEC FIX #3: authenticate the request
        },
        body: JSON.stringify({ amount, pixKey, userId: user.id })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { 
          success: false, 
          message: data.message || 'Erro ao processar o saque junto ao gateway.' 
        };
      }

      // BUG FIX #7: only debit balance AFTER server confirms success
      setBalance(prev => prev - amount);

      const fee = amount * 0.10;
      const netAmount = amount - fee;

      const tx: Transaction = {
        id: `tx-withdraw-${Date.now()}`,
        type: 'withdraw',
        amount: amount,
        timestamp: Date.now(),
        status: 'pending',
        details: `Saque solicitado para Chave Pix: ${pixKey} (Líquido: R$ ${netAmount.toFixed(2)}, Taxa 10%: R$ ${fee.toFixed(2)})`
      };
      setTransactions(prev => [tx, ...prev]);

      return { success: true, message: data.message };

    } catch (error) {
      console.error('[SimulatorContext] Withdraw error:', error);
      return { 
        success: false, 
        message: 'Falha de comunicação com o servidor de pagamentos.' 
      };
    }
  };

  // Toggle speed modifiers (mock speed toggler deleted for live center, mock kept for fallback)
  const toggleSpeed = () => {
    // Speed locked in production
  };

  // Claim Daily Coolant Checkin
  const claimCheckIn = () => {
    if (checkInClaimedToday) return;

    const checkInReward = 0.50;
    setBalance(prev => prev + checkInReward);
    setCheckInClaimedToday(true);

    // BUG FIX #5: persist today's date alongside the boolean so reset works on next login
    if (supabase && user) {
      supabase
        .from('profiles')
        .update({ checkin_claimed_today: true, last_checkin_date: todayDateStr() })
        .eq('id', user.id)
        .then(() => {});
    }

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'checkin_bonus',
      amount: checkInReward,
      timestamp: Date.now(),
      status: 'completed',
      details: 'Check-in Diário de Carga Criogênica Reivindicado!'
    };
    setTransactions(prev => [tx, ...prev]);
  };

  // Claim Mission Reward
  const claimMissionReward = (missionId: string) => {
    const mission = INITIAL_MISSIONS.find(m => m.id === missionId);
    if (!mission || completedMissions.includes(missionId)) return;

    setBalance(prev => prev + mission.rewardAmount);
    setCompletedMissions(prev => [...prev, missionId]);

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'referral_bonus',
      amount: mission.rewardAmount,
      timestamp: Date.now(),
      status: 'completed',
      details: `Missão Alienware Desbloqueada: ${mission.name}`
    };
    setTransactions(prev => [tx, ...prev]);
  };

  // Invite dynamic mock co-pilot
  const addMockReferral = () => {
    const usersList = ['XenonPilot_99', 'CypherNode_Alien', 'QuantumGamer_Z', 'NebulaDrifter', 'RazerOverlord'];
    const chosenName = usersList[Math.floor(Math.random() * usersList.length)] + `_${Math.floor(Math.random()*90 + 10)}`;
    const buyInvests = [0, 50, 50, 250, 250, 1000];
    const investment = buyInvests[Math.floor(Math.random() * buyInvests.length)];
    const commission = investment * COMMISSIONS.level1;

    const newPilot: ReferralPilot = {
      id: `pilot-${Date.now()}`,
      username: chosenName,
      avatarUrl: ['👽', '👾', '🤖', '👑', '🚀'][Math.floor(Math.random() * 5)],
      joinedAt: Date.now(),
      investmentAmount: investment,
      commissionEarned: commission
    };

    setReferrals(prev => [newPilot, ...prev]);

    if (commission > 0) {
      setBalance(prev => prev + commission);
      
      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'referral_bonus',
        amount: commission,
        timestamp: Date.now(),
        status: 'completed',
        details: `Comissão de Indicação Co-piloto (${chosenName})`
      };
      setTransactions(prev => [tx, ...prev]);
    }
  };

  // Reset local progress
  const resetAllSimulation = () => {
    setBalance(0.00);
    setUnclaimedYield(0);
    setCheckInClaimedToday(false);
    setCompletedMissions([]);
    setReferrals([]);
    setUserRigs([]);
    setTransactions([]);
  };

  return (
    <SimulatorContext.Provider value={{
      user,
      balance,
      balanceInvested,
      userRigs,
      unclaimedYield,
      transactions,
      referrals,
      completedMissions,
      simulationSpeed,
      simulationTimeElapsed,
      checkInClaimedToday,
      login,
      register,
      logout,
      buyHardware,
      sellHardware,
      claimYield,
      claimIndividualYield,
      depositFunds,
      withdrawFunds,
      toggleSpeed,
      claimCheckIn,
      claimMissionReward,
      addMockReferral,
      resetAllSimulation
    }}>
      {children}
    </SimulatorContext.Provider>
  );
};
