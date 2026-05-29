/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { COMMISSIONS } from '../data';
import { 
  Users, 
  Share2, 
  Copy, 
  UserPlus, 
  Award, 
  TrendingUp, 
  HelpCircle,
  Cpu
} from 'lucide-react';

export default function Referrals() {
  const { referrals, addMockReferral } = useSimulator();
  const [isCopied, setIsCopied] = useState(false);

  // Calculate pilot network statistics
  const totalPilots = referrals.length;
  const activeInvestors = referrals.filter(r => r.investmentAmount > 0).length;
  const totalCommissions = referrals.reduce((acc, curr) => acc + curr.commissionEarned, 0);

  // Simulated link
  const promoLink = `https://thealienware.com/invite?pilot=AW_${Math.floor(Math.random() * 8000 + 1000)}`;

  const copyPromoLink = () => {
    navigator.clipboard.writeText(promoLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Referral Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_75%)] pointer-events-none" />
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-450" />
          <h3 className="text-lg font-semibold text-slate-100 font-sans tracking-tight font-sans">Comando de Co-Pilotos da Frota</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Expanda o alcance da frota computacional Alienware convidando novos aliados. 
          Sempre que um Co-Piloto direto ou indireto adquirir um novo servidor de processamento, você recebe bonificações em tempo real creditadas em seu saldo.
        </p>

        {/* Dynamic commission specs */}
        <div className="mt-5 grid grid-cols-3 gap-3 font-mono text-3xs text-center">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
            <span className="text-slate-500 block">NÍVEL 1 (DIRETO)</span>
            <span className="text-emerald-400 font-bold block mt-0.5">{(COMMISSIONS.level1 * 100)}% COMISSÃO</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
            <span className="text-slate-500 block">NÍVEL 2</span>
            <span className="text-cyan-400 font-bold block mt-0.5">{(COMMISSIONS.level2 * 100)}% COMISSÃO</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
            <span className="text-slate-500 block">NÍVEL 3</span>
            <span className="text-indigo-400 font-bold block mt-0.5">{(COMMISSIONS.level3 * 100)}% COMISSÃO</span>
          </div>
        </div>
      </div>

      {/* Stats Counter boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-4xs font-mono text-slate-500 uppercase block">Co-Pilotos Recrutados</span>
            <span className="text-md font-bold text-slate-200 mt-0.5 block">{totalPilots} Pilotos</span>
          </div>
          <div className="p-1.5 bg-slate-950 rounded-lg text-slate-500">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-4xs font-mono text-slate-500 uppercase block">Instâncias Ativas</span>
            <span className="text-md font-bold text-slate-200 mt-0.5 block">{activeInvestors} Ativos</span>
          </div>
          <div className="p-1.5 bg-slate-950 rounded-lg text-slate-500">
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-4xs font-mono text-slate-500 uppercase block">Comissões Recebidas</span>
            <span className="text-md font-bold text-emerald-450 mt-0.5 block">R$ {totalCommissions.toFixed(2)}</span>
          </div>
          <div className="p-1.5 bg-slate-950 rounded-lg text-slate-500">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Referral URL sharing link */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-sm font-semibold text-slate-200 font-sans tracking-tight">Compartilhamento de Link Unificado</h4>
            <p className="text-3xs text-slate-400">Distribua seu link único Alienware para recrutar novos pilotos em pools de mineração.</p>
          </div>

          <div className="space-y-2">
            <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">Seu Link Multipass de Indicação</span>
            <div className="flex bg-slate-950 border border-slate-850 p-3 rounded-xl justify-between items-center gap-2">
              <span className="text-2xs font-mono text-cyan-400 truncate text-left">{promoLink}</span>
              <button
                onClick={copyPromoLink}
                className="px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/30 text-cyan-400 font-mono text-3xs font-bold rounded uppercase flex items-center gap-1.5 shrink-0 transition duration-300 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {isCopied ? 'COPIADO' : 'COPIAR LINK'}
              </button>
            </div>
          </div>

          {/* Interactive Simulation Block */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-dashed border-indigo-500/20 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 mt-0.5">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="space-y-1 text-left">
                <h5 className="text-xs font-semibold text-slate-300 font-sans">Simular Novos Aliados Convidando</h5>
                <p className="text-3xs text-slate-400 max-w-md">
                  Para fins de teste do sistema de comissões instantâneas, utilize o simulador para criar um convidado randômico comprando hardwares e verifique sua comissão caindo na carteira na hora!
                </p>
              </div>
            </div>

            <button
              onClick={addMockReferral}
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-500 text-slate-100 border border-indigo-500/40 hover:shadow-indigo-500/10 hover:scale-101 transition duration-300 rounded-xl font-mono text-3xs font-bold uppercase tracking-wider cursor-pointer"
            >
              🚀 SIMULAR NOVO CO-PILOTO NO RECRUTAMENTO
            </button>
          </div>

        </div>

        {/* Invited pilots list */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <span className="text-3xs font-mono text-slate-400 uppercase tracking-widest">Painel de Pilotos Vinculados</span>
              <span className="text-4xs font-mono text-slate-600">HISTÓRICO</span>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {referrals.map((pil) => (
                <div key={pil.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between text-2xs font-mono">
                  <div className="flex items-center gap-2.5 text-left">
                    <span className="text-base select-none leading-none">{pil.avatarUrl}</span>
                    <div className="leading-tight">
                      <span className="text-slate-300 font-sans font-medium block">{pil.username}</span>
                      <span className="text-3xs text-slate-500 font-mono block mt-0.5">Compra: R$ {pil.investmentAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">
                      +R$ {pil.commissionEarned.toFixed(2)}
                    </span>
                    <span className="text-4xs text-slate-600 block mt-0.5 uppercase">
                      COMISSÃO N1
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-4xs text-slate-500 font-mono pt-4 mt-4 border-T border-slate-800 text-center uppercase tracking-widest">
            Comissionamento em 3 camadas Alienware Node Network
          </p>

        </div>

      </div>

    </div>
  );
}
