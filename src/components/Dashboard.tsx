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

  // Compute stats
  const totalHashrate = userRigs.reduce((acc, curr) => {
    const isGiga = curr.dailyYieldPercent >= 4.0; 
    return acc + (isGiga ? 2.4 : 0.45); // simplistic Giga count
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
              Sua frota computacional está integrada. Acelere a simulação para simular rendimentos em tempo recorde!
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
            <span className="text-slate-500 font-mono">Simulador Ativo</span>
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
            <span className="text-slate-500 font-mono">Instâncias Virtuais</span>
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

      {/* Main Core Controls Box: Unclaimed income + Warp Drive Modifier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Cloud Mining Central Income Extractor */}
        <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                <h3 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">Extrator de Renda Alienware</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Colete os rendimentos gerados cooperativamente pela frota ativa.</p>
            </div>
            
            {/* Quick claim single button */}
            <button
              onClick={claimYield}
              disabled={unclaimedYield <= 0.01}
              className={`w-full md:w-auto px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition duration-300 flex items-center justify-center gap-2 border shadow-lg ${
                unclaimedYield > 0.01
                  ? 'bg-gradient-to-r from-cyan-505 via-cyan-500 to-indigo-600 text-slate-900 border-cyan-400 shadow-cyan-500/20 hover:scale-102 hover:shadow-cyan-400/40 cursor-pointer'
                  : 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${unclaimedYield > 0.01 ? 'animate-spin' : ''}`} />
              COLETAR SINAL (R$ {unclaimedYield.toFixed(2)})
            </button>
          </div>

          {/* Central Yield Reactor Visual */}
          <div className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden py-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_0%,transparent_70%)] pointer-events-none" />
            
            {/* Glowing circle representation of ledger energy */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/30 animate-[spin_40s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-double border-indigo-500/20" />
              <div className={`absolute inset-4 rounded-full bg-gradient-to-br from-cyan-950/20 to-indigo-950/40 border border-cyan-500/10 flex flex-col items-center justify-center transition-all shadow-[0_0_30px_rgba(6,182,212,0.05)] ${unclaimedYield > 0.01 ? 'shadow-[0_0_40px_rgba(6,182,212,0.15)] border-cyan-400/30' : ''}`} />
              
              <div className="z-10 text-center">
                <Coins className={`w-8 h-8 mx-auto mb-1 text-cyan-400 ${unclaimedYield > 0.01 ? 'animate-bounce' : 'opacity-60'}`} />
                <span className="text-2xs font-mono text-cyan-500 uppercase tracking-widest">REACTOR</span>
              </div>
            </div>

            <p className="text-2xs font-mono text-slate-400 uppercase tracking-widest">Rendimento Acumulado Aguardando Coleta</p>
            <h2 className="text-3xl font-bold font-sans tracking-tight text-slate-100 mt-2">
              R$ {unclaimedYield.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </h2>
            <p className="text-2xs text-slate-500 font-mono mt-1">
              Velocidade líquida atual da rede: {((userRigs.reduce((acc, curr) => acc + curr.dailyYieldAmount, 0)) / 86400 * simulationSpeed).toFixed(5)} R$/segundo
            </p>

            <div className="w-full max-w-sm mt-5 bg-slate-900 rounded-lg p-2.5 border border-slate-800 text-3xs text-slate-400 font-mono text-left space-y-1">
              <div className="flex justify-between">
                <span>REFRIGERAÇÃO EXTRA:</span>
                <span className="text-cyan-400">ATIVADO (LIQUID NITROGEN)</span>
              </div>
              <div className="flex justify-between">
                <span>ALOCAÇÃO COMPUTAÇÃO IN NUVEM:</span>
                <span className="text-indigo-400">100% EXCLUSIVO</span>
              </div>
            </div>
          </div>

          {/* Quick instructions */}
          <div className="mt-4 text-2xs text-slate-400 space-y-1 bg-slate-950/30 p-3 rounded-lg border border-slate-800/40">
            <span className="font-mono text-slate-300 font-medium block mb-0.5">ℹ️ SOBRE O PROCESSO DE RENDIMENTOS:</span>
            <p>Os hardwares em sua frota geram frações de rendimentos a cada segundo simulado. Ao coletar, os valores são sacados para sua carteira instantaneamente, ficando prontos para reinvestimento ou saque PIX!</p>
          </div>

        </div>

        {/* Warp Drive Speed Modifier Unit */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          
          {/* Simulation controller card */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-semibold text-slate-200 font-sans tracking-tight">Painel de Warp Alienware</h4>
                </div>
                <Clock className="w-4 h-4 text-slate-500" />
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Esta plataforma inclui um **Time-Warp Simulator**. Como os hardwares pagam rendimentos por período diário, você pode acelerar ou desacelerar o tempo para simular dias ou meses de lucros em segundos!
              </p>

              {/* Holographic Speed visualizer */}
              <div className={`p-4 rounded-xl border mb-5 text-center transition-all ${getSpeedColor()}`}>
                <span className="text-3xs font-mono uppercase tracking-widest block mb-1 opacity-75">MULTIPLICADOR DE TEMPO ATIVO</span>
                <span className="text-xl font-black font-mono tracking-wider block">{simulationSpeed}x</span>
                <span className="text-2xs font-sans mt-1 block">{getSpeedDesc()}</span>
              </div>

              {/* Selector grid */}
              <div className="space-y-2.5">
                <button
                  onClick={toggleSpeed}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-cyan-950 hover:to-indigo-950 hover:border-cyan-500/50 text-slate-200 border border-slate-800 text-xs font-mono flex items-center justify-between transition group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-18s transition-transform duration-700" />
                    ACELERAR LINHA DO TEMPO
                  </span>
                  <ChevronsRight className="w-4 h-4 text-cyan-400 animate-pulse" />
                </button>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-800/60 pt-3">
              <span className="text-[10px] font-mono text-slate-500 block uppercase mb-1">Estatísticas do Time-Warp</span>
              <div className="flex justify-between text-2xs text-slate-400">
                <span>Segundo Real :</span>
                <span className="text-slate-300 font-mono">
                  {simulationSpeed === 1 ? '1 Segundo' : ''}
                  {simulationSpeed === 60 ? '1 Minuto' : ''}
                  {simulationSpeed === 3600 ? '1 Hora' : ''}
                  {simulationSpeed === 86400 ? '1 Dia Completo' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Check-in Module */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-500">Bônus Criogênico Diário</span>
                <h4 className="text-sm font-semibold text-slate-200 font-sans mt-0.5">Check-in de Resfriamento</h4>
              </div>
              <div className="text-xl">❄️</div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Reivindique sua cota diária de resfriamento para ganhar um bônus imediato de **R$ 3,50** no saldo de investimentos.
            </p>

            <button
              onClick={claimCheckIn}
              disabled={checkInClaimedToday}
              className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase border transition duration-300 ${
                checkInClaimedToday 
                  ? 'bg-slate-800/30 border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer'
              }`}
            >
              {checkInClaimedToday ? '✓ CHECK-IN REALIZADO HOJE' : 'REGISTRAR CARGA (+ R$ 3,50)'}
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
            <p className="text-2xs text-slate-400">Complete os testes computacionais simulados do sistema e desative travas de saques ou receba subsídios.</p>
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

      {/* Simulated System Reset Utility */}
      <div className="bg-slate-900/40 p-4 border border-dashed border-red-500/20 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h5 className="text-xs font-semibold text-slate-300">Depuração e Testes Internos</h5>
          <p className="text-3xs text-slate-500 mt-0.5">
            Reinicia todos os valores de LocalStorage, saldo inicial fictício da simulação e frota para os padrões de fábrica.
          </p>
        </div>
        <div>
          {resetConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  resetAllSimulation();
                  setResetConfirm(false);
                }}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 border border-red-500 text-red-100 font-mono text-2xs font-bold rounded uppercase transition cursor-pointer"
              >
                CONFIRMAR REBOOT
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-2xs rounded uppercase transition cursor-pointer"
              >
                CANCELAR
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirm(true)}
              className="px-4 py-1.5 bg-slate-900 hover:bg-red-950 hover:text-red-400 hover:border-red-500/30 border border-slate-800 rounded text-slate-500 font-mono text-2xs transition uppercase cursor-pointer"
            >
              REINICIAR SIMULADOR
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
