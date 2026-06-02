/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { INITIAL_MISSIONS } from '../data';
import { 
  Zap, 
  Cpu, 
  TrendingUp, 
  Clock, 
  Coins, 
  Award, 
  Users, 
  ChevronsRight, 
  RefreshCw,
  Gauge,
  Sliders,
  BellRing
} from 'lucide-react';

export default function Dashboard() {
  const {
    balance,
    balanceInvested,
    userRigs,
    unclaimedYield,
    transactions,
    referrals,
    completedMissions,
    simulationSpeed,
    checkInClaimedToday,
    claimYield,
    toggleSpeed,
    claimCheckIn,
    claimMissionReward,
    resetAllSimulation
  } = useSimulator();

  const [resetConfirm, setResetConfirm] = useState(false);

  // Compute stats — derive hashrate from rig product data
  const HASHRATE_MAP: Record<string, number> = {
    'aw-plano-teste': 0.05,
    'aw-aurora-r16': 0.45,
    'aw-m18-matrix': 2.4,
    'aw-area51-thread': 11.8,
    'aw-x14-slim': 32.6,
    'aw-quantum-hive': 68.5,
  };
  const totalHashrate = userRigs.reduce((acc, rig) => {
    return acc + (HASHRATE_MAP[rig.productId] || 0);
  }, 0);

  const estimatedDailyEarnings = userRigs.reduce((acc, curr) => acc + curr.dailyYieldAmount, 0);
  const totalPower = userRigs.reduce((acc, curr) => acc + (curr.cost * 4.2), 0); // Simulated power index

  // Filter out recent transactions
  const recentTx = transactions.slice(0, 4);

  // Get current active speed description
  const getSpeedDesc = () => {
    if (simulationSpeed === 1) return 'Tempo Real (1x)';
    if (simulationSpeed === 60) return 'Distorção Leve (60x - 1s = 1 min)';
    if (simulationSpeed === 3600) return 'Warp-3600 (3600x - 1s = 1 hora)';
    if (simulationSpeed === 86400) return 'Hyperwarp-86400 (1s = 1 dia)';
    return 'Customizado';
  };

  // Helper to retrieve color
  const getSpeedColor = () => {
    if (simulationSpeed === 1) return 'text-slate-400 border-slate-700 bg-slate-900/40';
    if (simulationSpeed === 60) return 'text-cyan-400 border-cyan-800/50 bg-cyan-950/20';
    if (simulationSpeed === 3600) return 'text-indigo-400 border-indigo-800/50 bg-indigo-950/20';
    return 'text-rose-400 border-rose-800/50 bg-rose-950/20 animate-pulse';
  };

  // Render mission metrics
  const getMissionProgress = (mission: typeof INITIAL_MISSIONS[0]) => {
    if (mission.type === 'buy_nodes') {
      return userRigs.length;
    } else if (mission.type === 'total_balance') {
      return Math.floor(balance);
    } else if (mission.type === 'invite_pilots') {
      return referrals.length;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Alert / Information */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-indigo-950/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-100 font-sans">
              Matriz Ativa: Rede de Geração Alienware Operacional
            </h4>
            <p className="text-xs text-slate-400">
              Sua frota computacional está integrada e gerando rendimentos de hashrate em tempo real.
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            ONLINE (LATÊNCIA 4MS)
          </span>
        </div>
      </div>

      {/* Grid of Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card: Wallet Balance */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition rounded-xl p-5 relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xs font-mono text-slate-400 uppercase tracking-widest">Saldo de Conta (PIX)</p>
              <h3 className="text-2xl font-semibold text-slate-100 tracking-tight font-sans mt-1.5">
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-2xs border-t border-slate-800/60 pt-3">
            <span className="text-slate-500 font-mono">Carteira Ativa</span>
            <span className="text-emerald-400 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Auto-líquido
            </span>
          </div>
        </div>

        {/* Card: Active Investment */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition rounded-xl p-5 relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xs font-mono text-slate-400 uppercase tracking-widest">Valor Minerando</p>
              <h3 className="text-2xl font-semibold text-slate-100 tracking-tight font-sans mt-1.5">
                R$ {balanceInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-2xs border-t border-slate-800/60 pt-3">
            <span className="text-slate-500 font-mono">Instâncias Ativas</span>
            <span className="text-indigo-400 font-medium font-sans">
              {userRigs.length} {userRigs.length === 1 ? 'Nó Ativo' : 'Nós Ativos'}
            </span>
          </div>
        </div>

        {/* Card: Daily Earnings Estimate */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition rounded-xl p-5 relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xs font-mono text-slate-400 uppercase tracking-widest">Rendimento Estimado</p>
              <h3 className="text-2xl font-semibold text-slate-100 tracking-tight font-sans mt-1.5">
                R$ {estimatedDailyEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-xs text-slate-400 font-normal">/dia</span>
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-2xs border-t border-slate-800/60 pt-3">
            <span className="text-slate-500 font-mono">Taxa Médias</span>
            <span className="text-emerald-400 font-medium">
              +{userRigs.length > 0 ? (estimatedDailyEarnings / Math.max(1, balanceInvested) * 100).toFixed(1) : 0}% a.d.
            </span>
          </div>
        </div>

        {/* Card: Computational Load */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition rounded-xl p-5 relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xs font-mono text-slate-400 uppercase tracking-widest">Hashrate Total</p>
              <h3 className="text-2xl font-semibold text-slate-100 tracking-tight font-sans mt-1.5">
                {totalHashrate > 0 ? totalHashrate.toFixed(2) : '0.00'}<span className="text-xs text-slate-400 font-normal"> GH/s</span>
              </h3>
            </div>
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-2xs border-t border-slate-800/60 pt-3">
            <span className="text-slate-500 font-mono">Consumo Térmico</span>
            <span className="text-rose-400 font-medium">
              {totalPower} Watts
            </span>
          </div>
        </div>

      </div>

      {/* Main Core Controls Box: Security and Check-in */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Security & Network Status Card */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-slate-200 font-sans tracking-tight">Status de Rede Alienware</h4>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]"></div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Sua conexão com o ecossistema de processamento em nuvem Alienware Capital está segura e criptografada de ponta a ponta.
            </p>

            {/* Holographic specs */}
            <div className="space-y-2.5 font-mono text-2xs">
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 flex justify-between">
                <span className="text-slate-500">SEGURANÇA FINANCEIRA</span>
                <span className="text-[#18FF6D] font-bold">ATIVA E SEGURA</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 flex justify-between">
                <span className="text-slate-500">CRIPTOGRAFIA LEDGER</span>
                <span className="text-indigo-400 font-bold">SHA-256 PROTOCOL</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 flex justify-between">
                <span className="text-slate-500">LATÊNCIA DA MATRIX</span>
                <span className="text-emerald-400 font-bold">4ms (ESTÁVEL)</span>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-800/60 pt-3">
            <span className="text-[10px] font-mono text-slate-500 block uppercase mb-1">Tecnologia Core</span>
            <div className="flex justify-between text-2xs text-slate-400">
              <span>Certificado SSL :</span>
              <span className="text-slate-350 font-mono">TLS 1.3 ATIVO</span>
            </div>
          </div>
        </div>

        {/* Quick Check-in Module */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-500">Bônus Criogênico Diário</span>
                <h4 className="text-sm font-semibold text-slate-200 font-sans mt-0.5">Check-in de Resfriamento</h4>
              </div>
              <div className="text-xl">❄️</div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Reivindique sua cota diária de resfriamento para ganhar um bônus imediato de **R$ 0,50** no saldo de investimentos.
            </p>
          </div>

          <div>
            <button
              onClick={claimCheckIn}
              disabled={checkInClaimedToday}
              className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase border transition duration-300 ${
                checkInClaimedToday 
                  ? 'bg-slate-800/30 border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer'
              }`}
            >
              {checkInClaimedToday ? '✓ CHECK-IN REALIZADO HOJE' : 'REGISTRAR CARGA (+ R$ 0,50)'}
            </button>
          </div>
        </div>

      </div>

      {/* Missions and Tasks list with rewards */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
          <Award className="w-5 h-5 text-indigo-400" />
          <div>
            <h4 className="text-sm font-semibold text-slate-200 font-sans tracking-tight">Setores de Missões: Alienware Vanguard</h4>
            <p className="text-2xs text-slate-400">Complete os objetivos de processamento de hardware e receba subsídios adicionais.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INITIAL_MISSIONS.map((mission) => {
            const isCompleted = completedMissions.includes(mission.id);
            const progress = getMissionProgress(mission);
            const percent = Math.min(100, Math.round((progress / mission.targetCount) * 100));
            const canClaim = !isCompleted && progress >= mission.targetCount;

            return (
              <div 
                key={mission.id} 
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted 
                    ? 'bg-slate-950/40 border-slate-900 opacity-75' 
                    : canClaim 
                    ? 'bg-indigo-950/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.05)]' 
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono tracking-wider rounded bg-slate-800 text-slate-400 uppercase">
                      {mission.badge}
                    </span>
                    <h5 className="text-xs font-semibold text-slate-200 font-sans mt-1">{mission.name}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">{mission.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-emerald-400 block">+R$ {mission.rewardAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex justify-between text-3xs font-mono text-slate-500">
                    <span>PROGRESSO</span>
                    <span>{progress} / {mission.targetCount} ({percent}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-slate-700' 
                          : percent >= 100 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Confirm payout claim button */}
                <div className="mt-3 flex justify-end">
                  {isCompleted ? (
                    <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">Missão Resolvida ✓</span>
                  ) : canClaim ? (
                    <button
                      onClick={() => claimMissionReward(mission.id)}
                      className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-505 text-slate-950 font-mono text-3xs font-bold rounded uppercase hover:scale-105 transition cursor-pointer"
                    >
                      RESGATAR R$ {mission.rewardAmount.toFixed(2)}
                    </button>
                  ) : (
                    <span className="text-3xs font-mono text-slate-600 uppercase tracking-widest">Em Andamento...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
}
