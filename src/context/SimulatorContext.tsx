/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { InvestmentProduct, UserRig, Transaction, ReferralPilot } from '../types';
import { INITIAL_PRODUCTS, INITIAL_MISSIONS, COMMISSIONS, ReferralPilot as DataPilot } from '../data';
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
                setBalance(Number(data.balance));
                setUserRigs(safeParseArray(data.user_rigs));
                setTransactions(safeParseArray(data.transactions));
                setReferrals(safeParseArray(data.referrals));
                setCompletedMissions(safeParseArray(data.completed_missions));
                setCheckInClaimedToday(data.checkin_claimed_today || false);
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

  // Sync state to Supabase when it changes
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

    const timeout = setTimeout(syncData, 1000);
    return () => clearTimeout(timeout);
  }, [balance, userRigs, transactions, referrals, completedMissions, checkInClaimedToday, user]);

  // Auth Functions
  const login = async (phoneOrEmail: string, passwordRequired: string): Promise<boolean> => {
    if (!supabase) {
      alert('Configuração ausente: Por favor, adicione as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no painel de controle da Vercel para liberar o login e banco de dados real.');
      return false;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_or_email', phoneOrEmail)
        .eq('password', passwordRequired)
        .single();

      if (error || !data) {
        return false;
      }

      setUser({ id: data.id, phone_or_email: data.phone_or_email });
      setBalance(Number(data.balance));
      setUserRigs(safeParseArray(data.user_rigs));
      setTransactions(safeParseArray(data.transactions));
      setReferrals(safeParseArray(data.referrals));
      setCompletedMissions(safeParseArray(data.completed_missions));
      setCheckInClaimedToday(data.checkin_claimed_today || false);
      
      localStorage.setItem('aw_logged_user', JSON.stringify({ id: data.id, phone_or_email: data.phone_or_email }));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const register = async (phoneOrEmail: string, passwordRequired: string): Promise<boolean> => {
    if (!supabase) {
      alert('Configuração ausente: Por favor, adicione as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no painel de controle da Vercel para liberar o cadastro e banco de dados real.');
      return false;
    }
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_or_email', phoneOrEmail)
        .maybeSingle();

      if (existing) {
        return false;
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          phone_or_email: phoneOrEmail,
          password: passwordRequired,
          balance: 0.00,
          user_rigs: [],
          transactions: [],
          referrals: [],
          completed_missions: [],
          checkin_claimed_today: false
        }])
        .select()
        .single();

      if (error || !data) {
        console.error('Registration error:', error);
        return false;
      }

      setUser({ id: data.id, phone_or_email: data.phone_or_email });
      setBalance(0.00);
      setUserRigs([]);
      setTransactions([]);
      setReferrals([]);
      setCompletedMissions([]);
      setCheckInClaimedToday(false);
      
      localStorage.setItem('aw_logged_user', JSON.stringify({ id: data.id, phone_or_email: data.phone_or_email }));

      // Process referral signup bonus if referrer code exists
      const referrerCode = localStorage.getItem('aw_referrer');
      if (referrerCode && referrerCode !== getReferralCode(data)) {
        try {
          // Fetch all profiles to find which user has the matching 6-digit code
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('*');

          if (allProfiles) {
            const referrerData = allProfiles.find(p => getReferralCode(p) === referrerCode);

            if (referrerData) {
              const refs = safeParseArray(referrerData.referrals);
              if (!refs.some((r: any) => r.username === phoneOrEmail.split('@')[0])) {
                const newReferralItem = {
                  id: data.id,
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

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aw_logged_user');
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
    
    const interval = setInterval(() => {
      const simSecondsPassed = speedRef.current;
      setSimulationTimeElapsed(prev => prev + simSecondsPassed);

      if (userRigsRef.current.length === 0) return;

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

    // Pay level-1 commission to referrer if one exists in the database
    if (supabase && user) {
      (async () => {
        try {
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('id, referrals, balance, transactions');

          if (allProfiles) {
            const referrer = allProfiles.find(p => {
              const refs = safeParseArray(p.referrals);
              return refs.some(r => r.id === user.id);
            });

            if (referrer) {
              const refs = safeParseArray(referrer.referrals);
              const updatedRefs = refs.map(r => {
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

              const commissionAmount = product.cost * COMMISSIONS.level1;
              const referrerNewBalance = Number(referrer.balance) + commissionAmount;

              const commissionTx: Transaction = {
                id: `tx-${Date.now()}`,
                type: 'referral_bonus',
                amount: commissionAmount,
                timestamp: Date.now(),
                status: 'completed',
                details: `Comissão Nível 1: Compra de ${product.name} por Co-piloto`
              };
              const referrerNewTxs = [commissionTx, ...safeParseArray(referrer.transactions)];

              await supabase
                .from('profiles')
                .update({
                  referrals: updatedRefs,
                  balance: referrerNewBalance,
                  transactions: referrerNewTxs
                })
                .eq('id', referrer.id);
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
    setBalance(prev => prev + amount);

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      amount: amount,
      timestamp: Date.now(),
      status: 'completed',
      details: 'Depósito PIX Recarregado Via Matriz Alienware'
    };
    setTransactions(prev => [tx, ...prev]);
  };

  // Withdraw funds via backend integration with IronPay
  const withdrawFunds = async (amount: number, pixKey: string): Promise<{ success: boolean; message: string }> => {
    if (amount < 20.00) {
      return { success: false, message: 'O valor mínimo para saque é de R$ 20,00.' };
    }
    if (amount > balance) {
      return { success: false, message: 'Saldo insuficiente para esta transação.' };
    }

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, pixKey })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { 
          success: false, 
          message: data.message || 'Erro ao processar o saque junto ao gateway.' 
        };
      }

      setBalance(prev => prev - amount);

      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'withdraw',
        amount: amount,
        timestamp: Date.now(),
        status: 'completed',
        details: `Saque PIX enviado para Chave: ${pixKey}`
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

    const checkInReward = 3.50;
    setBalance(prev => prev + checkInReward);
    setCheckInClaimedToday(true);

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
