/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { INITIAL_PRODUCTS } from '../data';
import { 
  Calculator as CalcIcon, 
  TrendingUp, 
  ChevronRight, 
  ArrowRightLeft,
  Sparkles,
  DollarSign
} from 'lucide-react';

export default function Calculator() {
  const [investValue, setInvestValue] = useState<number>(500);
  const [holdingDays, setHoldingDays] = useState<number>(30);
  const [selectedProductPreset, setSelectedProductPreset] = useState<string>('custom');

  // Daily yield averages based on invest size
  // 50-250 R$ yields ~3.0%
  // 250-999 R$ yields ~4.0%
  // 1000-4999 R$ yields ~5.0%
  // 5000+ R$ yields ~6.5%
  const getDynamicYieldPercent = (value: number) => {
    if (value < 250) return 3.0; // 3%
    if (value < 1000) return 4.0; // 4%
    if (value < 5000) return 5.0; // 5%
    return 6.5; // 6.5%
  };

  const currentYieldPercent = getDynamicYieldPercent(investValue);
  const computedDailyIncome = investValue * (currentYieldPercent / 100);
  const totalProfit = computedDailyIncome * holdingDays;
  const grandTotal = investValue + totalProfit;

  // Handles presets selection matching products
  const applyProductPreset = (productId: string) => {
    setSelectedProductPreset(productId);
    if (productId === 'custom') return;
    
    const prod = INITIAL_PRODUCTS.find(p => p.id === productId);
    if (prod) {
      setInvestValue(prod.cost);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,transparent_75%)]" />
        <div className="flex items-center gap-2">
          <CalcIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">Projeção e Simulador de Rendimento</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Calcule precisamente seus ganhos simulados baseado nas taxas de mineração de pool Alienware. Ajuste valor e tempo de acumulação para traçar sua meta.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sliders and Configurations */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* Hardware Product Presets */}
          <div>
            <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block mb-2.5">Escolher Modelo de Nó para Preenchimento</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-3xs">
              <button
                onClick={() => applyProductPreset('custom')}
                className={`py-2 px-3 rounded-lg border text-center transition cursor-pointer ${
                  selectedProductPreset === 'custom' 
                    ? 'bg-slate-100 text-slate-950 font-bold border-white' 
                    : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                CUSTOMIZADO
              </button>
              {INITIAL_PRODUCTS.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => applyProductPreset(prod.id)}
                  className={`py-2 px-1.5 rounded-lg border text-center transition truncate uppercase cursor-pointer ${
                    selectedProductPreset === prod.id 
                      ? 'bg-cyan-500/10 border-cyan-500/60 text-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.1)]' 
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'
                  }`}
                >
                  {prod.tier} ({prod.cost} R$)
                </button>
              ))}
            </div>
          </div>

          {/* Investment Balance Slider Value */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-2xs font-mono text-slate-400 uppercase tracking-widest">Valor do Investimento (R$)</label>
              
              {/* Manual numeric input alongside slider */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-3xs font-mono text-slate-500">R$</span>
                <input
                  type="number"
                  value={investValue}
                  onChange={(e) => {
                    const parsed = Math.max(10, Math.min(100000, Number(e.target.value)));
                    setInvestValue(parsed);
                    setSelectedProductPreset('custom');
                  }}
                  className="bg-transparent text-xs font-mono font-bold text-cyan-400 focus:outline-none w-20 text-center"
                />
              </div>
            </div>

            <input
              type="range"
              min="50"
              max="20000"
              step="50"
              value={investValue}
              onChange={(e) => {
                setInvestValue(Number(e.target.value));
                setSelectedProductPreset('custom');
              }}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-950 rounded-lg appearance-none"
            />
            
            <div className="flex justify-between text-4xs font-mono text-slate-500">
              <span>MÍNIMO: R$ 50,00</span>
              <span>MÁXIMO: R$ 20.000,00</span>
            </div>
          </div>

          {/* holdingDays selection days */}
          <div className="space-y-3">
            <span className="text-2xs font-mono text-slate-400 uppercase tracking-widest block">Período de Acumulação e Custódia</span>
            <div className="grid grid-cols-4 gap-2 font-mono text-2xs">
              {[7, 30, 90, 365].map((presetDay) => (
                <button
                  key={presetDay}
                  onClick={() => setHoldingDays(presetDay)}
                  className={`py-2.5 rounded-xl border text-center transition cursor-pointer ${
                    holdingDays === presetDay 
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-650 font-bold text-slate-100 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 hover:border-slate-800'
                  }`}
                >
                  {presetDay} Dias
                </button>
              ))}
            </div>
          </div>

          {/* Estimated daily parameters */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/80 space-y-2.5 font-mono text-2xs">
            <div className="flex justify-between">
              <span className="text-slate-500">TAXA DIÁRIA PROJETADA:</span>
              <span className="text-cyan-400 font-bold">+{currentYieldPercent.toFixed(1)}% ao dia</span>
            </div>
            <div className="flex justify-between border-t border-slate-900 pt-2.5">
              <span className="text-slate-500">RENDIMENTO POR DIA EXTRAPOLADO:</span>
              <span className="text-emerald-400 font-bold">R$ {computedDailyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / dia</span>
            </div>
          </div>

        </div>

        {/* Projection outputs metrics and charts */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          
          <div>
            <span className="text-3xs font-mono text-emerald-400 uppercase tracking-widest block mb-4">Relatório de Rendimentos Projetados</span>
            
            <div className="space-y-4">
              
              {/* Card Output: Net Profit */}
              <div className="p-4 bg-slate-950 border border-slate-850/80 rounded-xl relative overflow-hidden">
                <span className="text-4xs font-mono text-slate-500 uppercase tracking-widest">Lucro Total Simulador</span>
                <h4 className="text-xl font-bold font-sans text-emerald-400 tracking-tight mt-1">
                  R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
                <p className="text-4xs font-mono text-slate-500 mt-0.5">Saldo extra gerado livre de taxas com overclock</p>
              </div>

              {/* Card Output: Grand total */}
              <div className="p-4 bg-slate-950 border border-slate-850/80 rounded-xl">
                <span className="text-4xs font-mono text-slate-500 uppercase tracking-widest">Retorno Total Acumulado (Custódia + Ganhos)</span>
                <h4 className="text-md font-bold font-sans text-slate-200 tracking-tight mt-1">
                  R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
                <p className="text-4xs font-mono text-slate-500 mt-0.5">Multiplicador total de {(grandTotal / investValue).toFixed(2)}x sobre o investimento original</p>
              </div>

            </div>

            {/* Micro bar diagram projection */}
            <div className="mt-6 space-y-2.5 font-mono">
              <span className="text-4xs text-slate-500 uppercase tracking-widest block">Gráfico Comparativo de Evolução</span>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-3xs text-slate-400">
                  <span>Aporte Inicial</span>
                  <span>R$ {investValue.toFixed(2)} ({Math.round(investValue / grandTotal * 100)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-[2px] border border-slate-850/60">
                  <div className="h-full rounded-full bg-cyan-500" style={{ width: `${(investValue / grandTotal) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-3xs text-slate-400">
                  <span>Lucro Acumulado</span>
                  <span className="text-emerald-400">R$ {totalProfit.toFixed(2)} ({Math.round(totalProfit / grandTotal * 100)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-[2px] border border-slate-850/60">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${(totalProfit / grandTotal) * 100}%` }} />
                </div>
              </div>
            </div>

          </div>

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <span className="text-4xs text-slate-500 font-mono inline-flex items-center gap-1.5 justify-center">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Overclock ativado garante estabilidade de +{currentYieldPercent}% diários
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
