/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { 
  Cpu, 
  RotateCcw, 
  Trash2, 
  Play, 
  Sparkles, 
  Database,
  ChevronsRight,
  TrendingUp,
  Award
} from 'lucide-react';

export default function MyFleet() {
  const { userRigs, claimIndividualYield, sellHardware, unclaimedYield } = useSimulator();

  // Helper to pick color values dynamically
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'cyan': return { border: 'border-cyan-500/20', text: 'text-cyan-400', progress: 'bg-cyan-500' };
      case 'indigo': return { border: 'border-indigo-500/20', text: 'text-indigo-400', progress: 'bg-indigo-500' };
      case 'emerald': return { border: 'border-emerald-500/20', text: 'text-emerald-400', progress: 'bg-emerald-400' };
      case 'rose': return { border: 'border-rose-500/20', text: 'text-rose-400', progress: 'bg-rose-500' };
      case 'amber': return { border: 'border-amber-500/20', text: 'text-amber-400', progress: 'bg-amber-500' };
      default: return { border: 'border-slate-800', text: 'text-slate-400', progress: 'bg-slate-600' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Fleet Dashboard Summary */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">Sua Frota de Processadores</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervisione a integridade, uptime de refrigeração e coleta incremental de todos os seus nós Alienware ativos.
          </p>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center flex gap-4 font-mono text-2xs">
          <div>
            <span className="text-slate-500 block">FROTA ATIVA</span>
            <span className="text-cyan-400 font-bold">{userRigs.length} Unidades</span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-slate-500 block">SINAL DO REACTOR PN</span>
            <span className="text-emerald-400 font-bold">R$ {unclaimedYield.toFixed(2)} acumulando</span>
          </div>
        </div>
      </div>

      {userRigs.length === 0 ? (
        /* Empty state warning user to buy product */
        <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-inner">
          <div className="p-4 bg-slate-950/80 rounded-full border border-slate-800/40 text-slate-600 shadow-inner">
            <Cpu className="w-10 h-10 animate-pulse text-slate-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-350">Nenhum Hardware Ativado no Momento</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Seu painel está ocioso. Adquira seu primeiro computador gamer Aurora ou Servidor ALX na seção de Hardware para iniciar a mineração automática de lucros simulados!
            </p>
          </div>
        </div>
      ) : (
        /* Active grid list */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {userRigs.map((rig) => {
            const colors = getColorClasses(rig.visualColor);
            
            // Calculate cycle percentages (each completed day resets cycles, 1440 mins = 24h)
            const completedCycles = Math.floor(rig.accumulatedMinutes / 1440);
            const minutesInCurrentCycle = rig.accumulatedMinutes % 1440;
            const cyclePercent = Math.min(100, Math.round((minutesInCurrentCycle / 1440) * 100));

            // Estimate accumulated yield under simulation time
            const accumulatedYield = (rig.dailyYieldAmount / 1440) * rig.accumulatedMinutes;

            return (
              <div 
                key={rig.id} 
                className={`bg-slate-900/50 backdrop-blur-md rounded-xl border p-5 flex flex-col justify-between transition-all hover:border-slate-700 hover:shadow-lg ${colors.border}`}
              >
                <div>
                  
                  {/* Card ID Line */}
                  <div className="flex justify-between items-center text-3xs font-mono text-slate-500 border-b border-slate-800/50 pb-2 mb-3">
                    <span className="uppercase tracking-widest">{rig.codename}</span>
                    <span className="text-slate-600">ID: #{rig.id.slice(-6)}</span>
                  </div>

                  {/* Header info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 font-sans tracking-tight">{rig.name}</h4>
                      <p className="text-4xs font-mono text-slate-500 mt-0.5 uppercase tracking-widest">Ativo {rig.tier}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">
                      <Cpu className={`w-4 h-4 ${colors.text} animate-pulse`} />
                    </div>
                  </div>

                  {/* Active telemetry parameters */}
                  <div className="bg-slate-950/60 rounded-lg p-3 my-4 space-y-1 bg-gradient-to-br from-slate-950/90 to-slate-900/60 border border-slate-850/40 font-mono text-3xs">
                    <div className="flex justify-between text-slate-500">
                      <span>CUSTO DE INSTALAÇÃO:</span>
                      <span className="text-slate-350">R$ {rig.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>ESTIMATIVA 24H:</span>
                      <span className="text-emerald-400 font-bold">+R$ {rig.dailyYieldAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>TEMPO OPERADO:</span>
                      <span className="text-indigo-400 font-bold">
                        {Math.floor(rig.accumulatedMinutes / 60)}h {Math.floor(rig.accumulatedMinutes % 60)}m (simulados)
                      </span>
                    </div>
                  </div>

                  {/* Custom Progress Cycle with speed updates */}
                  <div className="space-y-1.5 mb-5 font-mono">
                    <div className="flex justify-between text-3xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 text-emerald-400 fill-emerald-500 animate-pulse" />
                        CICLO DE RENDIMENTO ACUMULADO
                      </span>
                      <span className="text-slate-300">{cyclePercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-850/50">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${colors.progress}`}
                        style={{ width: `${cyclePercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-4xs text-slate-500">
                      <span>CICLOS CONCLUÍDOS:</span>
                      <span className="text-slate-300">{completedCycles} DIAS INTEGRADOS</span>
                    </div>
                  </div>

                  {/* Generated yield info */}
                  <div className="flex justify-between items-center text-2xs font-mono bg-slate-950/30 p-2 border border-slate-850/50 rounded-lg mb-4">
                    <span className="text-slate-500">RENDA ACUMULADA:</span>
                    <span className="text-emerald-400 font-bold">R$ {accumulatedYield.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                  </div>

                </div>

                {/* Claim triggers or recycle option */}
                <div className="grid grid-cols-2 gap-2">
                  
                  {/* Collect individual rig's yield */}
                  <button
                    onClick={() => claimIndividualYield(rig.id)}
                    disabled={accumulatedYield <= 0.01}
                    className={`py-2 rounded-lg text-3xs font-mono font-bold tracking-wider uppercase border transition duration-300 cursor-pointer ${
                      accumulatedYield > 0.01
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/5 hover:-translate-y-0.5'
                        : 'bg-slate-950/40 border-slate-950 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    COLETAR
                  </button>

                  {/* Trash nodes */}
                  <button
                    onClick={() => sellHardware(rig.id)}
                    className="py-2 rounded-lg text-3xs font-mono font-bold tracking-wider uppercase border border-red-500/10 text-red-400 bg-red-950/5 hover:bg-red-950/20 hover:border-red-500/30 transition hover:-translate-y-0.5 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    DESATIVAR
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Helper Box */}
      {userRigs.length > 0 && (
        <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
          <h5 className="text-2xs font-mono font-semibold text-slate-350 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            CONSELHOS DE OPTIMAL MINING COMPUTAÇÃO:
          </h5>
          <p className="text-3xs text-slate-500 font-mono mt-1.5 leading-relaxed">
            Seus computadores de alto desempenho possuem degradação de reciclagem. Caso queira desligar um nó, a Alienware devolve 70% do custo de investimento inicial imediatamente como saldo reembolsado em sua conta de investimentos. Deixar os servidores minerarem por ciclos completos garante 100% de rentabilidade pura.
          </p>
        </div>
      )}

    </div>
  );
}
