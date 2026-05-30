/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { INITIAL_PRODUCTS } from '../data';
import { 
  Zap, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  Gauge, 
  Activity, 
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function RigStore() {
  const { balance, buyHardware, userRigs } = useSimulator();
  const [purchaseStatus, setPurchaseStatus] = useState<{ [key: string]: 'idle' | 'success' | 'error' }>({});

  const handlePurchase = (productId: string, cost: number) => {
    if (balance < cost) {
      setPurchaseStatus(prev => ({ ...prev, [productId]: 'error' }));
      setTimeout(() => {
        setPurchaseStatus(prev => ({ ...prev, [productId]: 'idle' }));
      }, 3000);
      return;
    }

    const success = buyHardware(productId);
    if (success) {
      setPurchaseStatus(prev => ({ ...prev, [productId]: 'success' }));
      setTimeout(() => {
        setPurchaseStatus(prev => ({ ...prev, [productId]: 'idle' }));
      }, 3000);
    }
  };

  // Count active rigs owned by user for each product type
  const getOwnedCount = (productId: string) => {
    return userRigs.filter(r => r.productId === productId).length;
  };

  // Helper styles based on color theme
  const getThemeColorClass = (color: string) => {
    switch (color) {
      case 'cyan': return {
        border: 'border-cyan-500/20 hover:border-cyan-500/50',
        glow: 'shadow-[0_0_20px_rgba(6,182,212,0.08)] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
      };
      case 'indigo': return {
        border: 'border-indigo-500/20 hover:border-indigo-500/50',
        glow: 'shadow-[0_0_20px_rgba(99,102,241,0.08)] hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]',
        text: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
      };
      case 'emerald': return {
        border: 'border-emerald-500/20 hover:border-emerald-500/50',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.08)] hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      };
      case 'rose': return {
        border: 'border-rose-500/20 hover:border-rose-500/50',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.08)] hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]',
        text: 'text-rose-400',
        bg: 'bg-rose-500/10',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
      };
      case 'amber': return {
        border: 'border-amber-500/20 hover:border-amber-500/50',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)] hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      };
      default: return {
        border: 'border-slate-800 hover:border-slate-700',
        glow: 'shadow-none',
        text: 'text-slate-400',
        bg: 'bg-slate-800/50',
        badge: 'bg-slate-800 text-slate-400'
      };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Store Front Intro Board */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_75%)]" />
        
        <h3 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">Estação de Hardware Alienware</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Ative servidores computacionais de alta performance e garanta capacidade de processador na rede. 
          Cada unidade instalada gera fluxos de créditos contínuos para sua carteira. Os planos possuem progresso de 24 horas continuadas de mineração por lote.
        </p>

        {/* Dynamic warning balance */}
        <div className="mt-5 flex items-center justify-between bg-slate-950/50 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-350">Seu Saldo Disponível para Ativação:</span>
          </div>
          <span className="text-sm font-mono font-bold text-cyan-400">
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Grid List Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {INITIAL_PRODUCTS.map((prod) => {
          const style = getThemeColorClass(prod.visualColor);
          const owned = getOwnedCount(prod.id);
          const status = purchaseStatus[prod.id] || 'idle';
          
          // ROI calculation
          const roiDays = Math.ceil(prod.cost / prod.dailyYieldAmount);

          return (
            <div 
              key={prod.id} 
              className={`bg-slate-900/40 backdrop-blur-md rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 ${style.border} ${style.glow}`}
            >
              <div>
                
                {/* Header card info */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-3xs font-mono border uppercase ${style.badge}`}>
                      {prod.tier} tier
                    </span>
                    <h4 className="text-md font-bold text-slate-100 font-sans mt-2 tracking-tight">{prod.name}</h4>
                    <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">{prod.codename}</span>
                  </div>
                  {owned > 0 && (
                    <span className="px-2 py-0.5 rounded bg-cyan-950/30 border border-cyan-800/40 text-cyan-400 font-mono text-3xs">
                      {owned} ATIVO{owned > 1 ? 'S' : ''}
                    </span>
                  )}
                </div>

                {/* Sub-image replacement placeholder but highly technical */}
                <div className="relative h-44 rounded-xl overflow-hidden mb-5 bg-slate-950 border border-slate-800 flex items-center justify-center">
                  <div className="absolute inset-0 bg-contain bg-no-repeat bg-center opacity-100" style={{ backgroundImage: `url(${prod.imageUrl})` }} />
                  <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent`} />
                  
                  {/* Holographic matrix lines */}
                  <div className="absolute inset-x-0 bottom-0 p-4 z-10">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Preço de Partida</span>
                        <h3 className="text-xl font-black font-sans text-slate-100 tracking-tight">R$ {prod.cost.toFixed(2)}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-emerald-400 block">+R$ {prod.dailyYieldAmount.toFixed(2)} / dia</span>
                        <span className="text-4xs font-mono text-slate-500">Rendimento {prod.dailyYieldPercent.toFixed(1)}% ao dia</span>
                      </div>
                    </div>
                  </div>

                  {/* Icon layer representation */}
                  <div className={`absolute top-4 right-4 p-2 rounded-lg ${style.bg} text-slate-100 border border-slate-800/50 shadow-inner`}>
                    <Cpu className={`w-5 h-5 ${style.text}`} />
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {prod.description}
                </p>

                {/* Hardware Specifications Specsheet */}
                <div className="my-5 bg-slate-950/80 rounded-xl p-3 border border-slate-850 space-y-1.5 text-2xs font-mono">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">POTÊNCIA HASHRATE:</span>
                    <span className="text-slate-200">{prod.hashrate}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500 font-sans">EFICIÊNCIA TERMAL:</span>
                    <span className="text-cyan-400 font-mono">{prod.efficiency}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">ENERGIA/LOTE:</span>
                    <span className="text-rose-400">{prod.powerConsumption}W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RECOMPENSA DIÁRIA EXTRACT:</span>
                    <span className="text-emerald-400 font-bold">R$ {prod.dailyYieldAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* ROI helper message */}
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 mb-5 flex items-center gap-2 text-3xs text-slate-400 font-mono">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Retorno Total do Investimento (Break-even): ~{roiDays} dias se operado sem travas.</span>
                </div>

              </div>

              {/* Purchase triggers */}
              <div className="mt-2 space-y-2">
                <button
                  onClick={() => handlePurchase(prod.id, prod.cost)}
                  disabled={status === 'success'}
                  className={`w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border cursor-pointer ${
                    status === 'success'
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : status === 'error'
                      ? 'bg-rose-950 border-rose-500 text-rose-300 animate-headShake'
                      : 'bg-slate-800/40 hover:bg-slate-100 hover:text-slate-950 hover:border-white text-slate-200 border-slate-800'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {status === 'success' && 'NÓ DE HARDWARE ATIVADO ✓'}
                  {status === 'error' && 'SALDO DE CARTEIRA INSUFICIENTE'}
                  {status === 'idle' && `ATIVAR HARDWARE (R$ ${prod.cost.toFixed(2)})`}
                </button>

                 {status === 'error' && (
                  <p className="text-4xs text-rose-400 text-center font-mono">
                    * Recarregue sua carteira na seção &quot;Carteira&quot; via código PIX para adquirir este nó.
                  </p>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Safety Notice Policy */}
      <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-[#18FF6D] shrink-0 mt-0.5" />
        <div className="text-3xs text-slate-500 font-mono space-y-1">
          <p className="font-semibold text-slate-400 uppercase tracking-widest">ALIANÇA DE SEGURANÇA ALIENWARE PLATFORM:</p>
          <p>Esta plataforma opera ativação de hardware em nuvem de alta performance. Cada hardware adquirido garante capacidade de processamento dedicada e pagamentos baseados em hashrate alocado em pools globais.</p>
        </div>
      </div>

    </div>
  );
}
