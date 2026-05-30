/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { Lock, Mail, Phone, AlertCircle, RefreshCw, Zap, Shield, KeyRound } from 'lucide-react';
import logo from '../../logo.png';

export default function AuthPage() {
  const { login, register } = useSimulator();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Input fields
  const [phoneOrEmail, setPhoneOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputCleaned = phoneOrEmail.trim();
    if (!inputCleaned) {
      setErrorMessage('Por favor, insira seu E-mail ou Telefone.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor, insira sua senha.');
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === 'login') {
        const success = await login(inputCleaned, password);
        if (!success) {
          setErrorMessage('Credenciais incorretas ou conta não encontrada.');
        }
      } else {
        const success = await register(inputCleaned, password);
        if (!success) {
          setErrorMessage('Esta conta já está registrada ou ocorreu um erro no servidor.');
        }
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Ocorreu um erro ao processar a autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailInput = (input: string) => {
    return input.includes('@');
  };

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 flex flex-col items-center justify-center font-sans relative p-4 overflow-hidden selection:bg-[#18FF6D] selection:text-slate-950">
      
      {/* Absolute futuristic backgrounds */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(24,255,109,0.015)_1px,transparent_1px),linear-gradient(to_right,rgba(24,255,109,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#18FF6D]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#18FF6D]/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main card wrapper */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand logo at top */}
        <div className="text-center mb-6 flex flex-col items-center">
          <img 
            src={logo} 
            alt="Alienware Logo" 
            className="w-16 h-16 object-contain drop-shadow-[0_0_20px_#18FF6D] animate-pulse mb-3"
          />
          <h2 className="text-2xl font-bold tracking-tighter text-white uppercase">
            ALIENWARE <span className="text-[#18FF6D]">CAPITAL</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-1">
            SISTEMA DE HASH & INVESTIMENTO INTEGRADO
          </p>
        </div>

        {/* Auth form card */}
        <div className="bg-[#0c0c10]/80 backdrop-blur-md border border-[#18FF6D33] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Subtle top decoration beam */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#18FF6D] to-transparent shadow-[0_0_10px_#18FF6D]" />

          {/* Form Tabs selectors */}
          <div className="flex gap-2 p-1.5 bg-[#121216] border border-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 font-mono text-[10px] font-bold uppercase rounded-lg transition duration-300 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-[#18FF6D11] border border-[#18FF6D44] text-[#18FF6D]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Acessar Matrix
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 font-mono text-[10px] font-bold uppercase rounded-lg transition duration-300 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-[#18FF6D11] border border-[#18FF6D44] text-[#18FF6D]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input target identifier */}
            <div className="space-y-2">
              <label className="text-3xs font-mono text-slate-400 uppercase tracking-wider block">
                E-mail (Gmail) ou Telefone (com DDD)
              </label>
              <div className="flex items-center gap-2 bg-[#121216]/90 border border-slate-800 focus-within:border-[#18FF6D66] rounded-xl p-3.5 transition duration-300">
                {isEmailInput(phoneOrEmail) ? (
                  <Mail className="w-4 h-4 text-[#18FF6D] shrink-0" />
                ) : (
                  <Phone className="w-4 h-4 text-[#18FF6D] shrink-0" />
                )}
                <input
                  type="text"
                  required
                  placeholder="exemplo@gmail.com ou 11999999999"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 font-mono focus:outline-none w-full placeholder-slate-600"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label className="text-3xs font-mono text-slate-400 uppercase tracking-wider block">
                Senha Segura
              </label>
              <div className="flex items-center gap-2 bg-[#121216]/90 border border-slate-800 focus-within:border-[#18FF6D66] rounded-xl p-3.5 transition duration-300">
                <Lock className="w-4 h-4 text-[#18FF6D] shrink-0" />
                <input
                  type="password"
                  required
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 font-mono focus:outline-none w-full placeholder-slate-600"
                />
              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-3xs font-mono rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Trigger Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-[#18FF6D] via-[#11D356] to-emerald-600 text-slate-950 font-mono text-xs font-bold tracking-wider uppercase rounded-xl hover:shadow-[0_0_20px_rgba(24,255,109,0.3)] transition duration-300 hover:scale-101 cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  DESCRIPTOGRAFANDO CREDENCIAIS...
                </>
              ) : activeTab === 'login' ? (
                <>
                  <Zap className="w-4 h-4 text-slate-950" />
                  CONECTAR NA CARTEIRA
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-slate-950" />
                  REGISTRAR NOVA MATRIX
                </>
              )}
            </button>

          </form>

          {/* Futuristic bottom security tags */}
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 mt-6 pt-5 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-[#18FF6D]" />
              SUPABASE ENCRYPTED SHA-256
            </span>
            <span>SECURE GATEWAY v2.4</span>
          </div>

        </div>

      </div>

    </div>
  );
}
