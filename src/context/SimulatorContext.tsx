/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { InvestmentProduct, UserRig, Transaction, ReferralPilot } from '../types';
import { INITIAL_PRODUCTS, INITIAL_MISSIONS, COMMISSIONS, MOCK_PILOTS, Mission } from '../data';

interface SimulatorContextType {
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
  // Load initial local states or fallback
  const [balance, setBalance] = useState<number>(() => {
    const stored = localStorage.getItem('aw_balance');
    return stored ? parseFloat(stored) : 0.00; // Real account starts with 0
  });

  const [userRigs, setUserRigs] = useState<UserRig[]>(() => {
    const stored = localStorage.getItem('aw_user_rigs');
    if (stored) return JSON.parse(stored);
    return []; // Real account starts with 0 hardware nodes
  });

  const [unclaimedYield, setUnclaimedYield] = useState<number>(() => {
    const stored = localStorage.getItem('aw_unclaimed_yield');
    return stored ? parseFloat(stored) : 0.00;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const stored = localStorage.getItem('aw_transactions');
    if (stored) return JSON.parse(stored);
    return []; // Real account starts with no transaction history
  });

  const [referrals, setReferrals] = useState<ReferralPilot[]>(() => {
    const stored = localStorage.getItem('aw_referrals');
    return stored ? JSON.parse(stored) : []; // Real account starts with no referrals
  });

  const [completedMissions, setCompletedMissions] = useState<string[]>(() => {
    const stored = localStorage.getItem('aw_completed_missions');
    return stored ? JSON.parse(stored) : [];
  });

  const [simulationSpeed, setSimulationSpeed] = useState<number>(() => {
    return 1; // Locked to 1x (real time) for live operations
  });

  const [simulationTimeElapsed, setSimulationTimeElapsed] = useState<number>(0);
  const [checkInClaimedToday, setCheckInClaimedToday] = useState<boolean>(() => {
    const stored = localStorage.getItem('aw_checkin_claimed');
    return stored === 'true';
  });

  // Calculate dynamic invested balance
  const balanceInvested = userRigs.reduce((acc, curr) => acc + curr.cost, 0);

  // References for ticker loop
  const speedRef = useRef(simulationSpeed);
  speedRef.current = simulationSpeed;

  const userRigsRef = useRef(userRigs);
  userRigsRef.current = userRigs;

  // Save states on change
  useEffect(() => {
    localStorage.setItem('aw_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('aw_user_rigs', JSON.stringify(userRigs));
  }, [userRigs]);

  useEffect(() => {
    localStorage.setItem('aw_unclaimed_yield', unclaimedYield.toString());
  }, [unclaimedYield]);

  useEffect(() => {
    localStorage.setItem('aw_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('aw_referrals', JSON.stringify(referrals));
  }, [referrals]);

  useEffect(() => {
    localStorage.setItem('aw_completed_missions', JSON.stringify(completedMissions));
  }, [completedMissions]);

  useEffect(() => {
    localStorage.setItem('aw_sim_speed', simulationSpeed.toString());
  }, [simulationSpeed]);

  useEffect(() => {
    localStorage.setItem('aw_checkin_claimed', checkInClaimedToday ? 'true' : 'false');
  }, [checkInClaimedToday]);

  // Core Simulation Loop using interval
  useEffect(() => {
    const tickInterval = 1000; // Tick every 1s
    
    const interval = setInterval(() => {
      // Amount of simulated seconds that passed in this tick
      // speed 1 = 1s, speed 60 = 60s (1min), speed 3600 = 1hr, speed 86400 = 1day
      const simSecondsPassed = speedRef.current;
      
      setSimulationTimeElapsed(prev => prev + simSecondsPassed);

      if (userRigsRef.current.length === 0) return;

      // Update unclaimed yields for each rig incrementally
      // In 1 simulated day, a rig earns dailyYieldAmount
      // Daily seconds = 86400
      let totalTickYield = 0;
      
      setUserRigs(prevRigs => 
        prevRigs.map(rig => {
          const dailyYield = rig.dailyYieldAmount;
          // Yield earned in this tick
          const earnedOnTick = (dailyYield / 86400) * simSecondsPassed;
          totalTickYield += earnedOnTick;
          
          return {
            ...rig,
            // Track total minutes accrued by this rig under simulation
            accumulatedMinutes: rig.accumulatedMinutes + (simSecondsPassed / 60)
          };
        })
      );

      // Increment total unclaimed yield state
      setUnclaimedYield(prev => prev + totalTickYield);

    }, tickInterval);

    return () => clearInterval(interval);
  }, []);

  // Buy Hardware logic
  const buyHardware = (productId: string): boolean => {
    const product = INITIAL_PRODUCTS.find(p => p.id === productId);
    if (!product) return false;
    if (balance < product.cost) return false;

    // Deduct cost
    setBalance(prev => prev - product.cost);

    // Add User Rig
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

    // Save transaction
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'buy_hardware',
      amount: product.cost,
      timestamp: Date.now(),
      status: 'completed',
      details: `Ativado Nó ${product.name} (${product.codename})`
    };
    setTransactions(prev => [tx, ...prev]);

    return true;
  };

  // Sell Hardware back (at 70% buyback rate)
  const sellHardware = (userRigId: string) => {
    const rig = userRigs.find(r => r.id === userRigId);
    if (!rig) return;

    const refundAmount = rig.cost * 0.70;

    // Filter out
    setUserRigs(prev => prev.filter(r => r.id !== userRigId));
    setBalance(prev => prev + refundAmount);

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'withdraw', // negative from nodes fleet
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

    // Save transaction
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'claim_yield',
      amount: claimed,
      timestamp: Date.now(),
      status: 'completed',
      details: `Coleta total de rendimentos de mineração em nuvem`
    };
    setTransactions(prev => [tx, ...prev]);

    // Reset accumulated times on all rigs to represent payout claimed point
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

    // Calculate yield proportional to its accumulated minutes
    // Yield index per simulated minute: (dailyYieldAmount / 1440)
    // 1440 mins = 24 hours
    const accumulatedMins = rig.accumulatedMinutes;
    if (accumulatedMins <= 0.5) return; // Need at least some min to claim

    const individualEarned = (rig.dailyYieldAmount / 1440) * accumulatedMins;
    
    setBalance(prev => prev + individualEarned);
    
    // Deduct from total unclaimed tally
    setUnclaimedYield(prev => Math.max(0, prev - individualEarned));

    // Reset this rig accumulated
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

  // Deposit funds (simulated PIX)
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

  // Withdraw real/simulated funds via backend integration with IronPay
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

      // Deduct from balance only after gateway approval
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

  // Toggle speed modifiers: 1x (Real), 60x (1s = 1m), 3600x (1s = 1h), 86400x (1s = 24h)
  const toggleSpeed = () => {
    setSimulationSpeed(current => {
      if (current === 1) return 60;
      if (current === 60) return 3600;
      if (current === 3600) return 86400;
      return 1;
    });
  };

  // Claim Daily Coolant Checkin
  const claimCheckIn = () => {
    if (checkInClaimedToday) return;

    const checkInReward = 3.50; // daily cooling stipend
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
    
    // Random buy amount from simulated invitee
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

  // Reset Simulator Storage
  const resetAllSimulation = () => {
    localStorage.removeItem('aw_balance');
    localStorage.removeItem('aw_user_rigs');
    localStorage.removeItem('aw_unclaimed_yield');
    localStorage.removeItem('aw_transactions');
    localStorage.removeItem('aw_referrals');
    localStorage.removeItem('aw_completed_missions');
    localStorage.removeItem('aw_sim_speed');
    localStorage.removeItem('aw_checkin_claimed');

    // Reset local states to default (Clean real account values)
    setBalance(0.00);
    setUnclaimedYield(0);
    setSimulationSpeed(1);
    setCheckInClaimedToday(false);
    setCompletedMissions([]);
    setReferrals([]);
    setUserRigs([]);
    setTransactions([]);
  };

  return (
    <SimulatorContext.Provider value={{
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
