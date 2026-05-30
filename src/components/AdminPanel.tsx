/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Coins, 
  Cpu, 
  Lock, 
  ShieldAlert, 
  RefreshCw, 
  Edit, 
  X, 
  Check, 
  Database,
  ArrowLeft
} from 'lucide-react';
import logo from '../../logo.png';

interface Profile {
  id: string;
  phone_or_email: string;
  balance: number;
  user_rigs: any;
  transactions: any;
  created_at: string;
}

export default function AdminPanel() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Users data states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit balance modal states
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');

  // Stats
  const totalUsers = profiles.length;
  const totalBalance = profiles.reduce((acc, curr) => acc + Number(curr.balance), 0);
  const totalRigs = profiles.reduce((acc, curr) => {
    try {
      const rigs = typeof curr.user_rigs === 'string' ? JSON.parse(curr.user_rigs) : curr.user_rigs;
      return acc + (Array.isArray(rigs) ? rigs.length : 0);
    } catch {
      return acc;
    }
  }, 0);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (adminUsername === 'admin' && adminPassword === 'alienwareadmin2026') {
      setIsAdminLoggedIn(true);
      fetchProfiles();
    } else {
      setAuthError('Credenciais administrativas incorretas.');
    }
  };

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (e: any) {
      console.error(e);
      alert('Erro ao buscar perfis: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    const parsedBalance = parseFloat(newBalance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      alert('Por favor, insira um valor numérico válido.');
      return;
    }

    setActionLoading(editingProfile.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: parsedBalance })
        .eq('id', editingProfile.id);

      if (error) throw error;

      // Update local state
      setProfiles(prev => prev.map(p => p.id === editingProfile.id ? { ...p, balance: parsedBalance } : p));
      setEditingProfile(null);
    } catch (e: any) {
      console.error(e);
      alert('Erro ao atualizar saldo: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatRigsCount = (rigs: any) => {
    try {
      const parsed = typeof rigs === 'string' ? JSON.parse(rigs) : rigs;
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-[#08080a] text-slate-100 flex flex-col items-center justify-center font-sans relative p-4 selection:bg-[#18FF6D] selection:text-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(24,255,109,0.015)_1px,transparent_1px),linear-gradient(to_right,rgba(24,255,109,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-6">
            <img src={logo} alt="Alienware" className="w-14 h-14 mx-auto mb-2 drop-shadow-[0_0_15px_#18FF6D]" />
            <h2 className="text-xl font-bold tracking-tighter uppercase text-white">
              CONTROL CENTER <span className="text-[#18FF6D]">ADMIN</span>
            </h2>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">ACESSO INTERNO RESTRITO</p>
          </div>

          <div className="bg-[#0e0e12] border border-red-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_10px_#ef4444]" />
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">ADMIN USER</span>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full bg-[#121216]/90 border border-slate-800 focus:border-red-500/50 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">ADMIN PASSWORD</span>
                <div className="relative flex items-center bg-[#121216]/90 border border-slate-800 focus-within:border-red-500/50 rounded-xl p-3">
                  <Lock className="w-3.5 h-3.5 text-slate-500 mr-2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-transparent text-slate-200 font-mono text-xs focus:outline-none placeholder-slate-700"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-3xs font-mono rounded-lg flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-2xs font-bold uppercase rounded-xl transition duration-300 shadow-md shadow-red-950/20 cursor-pointer"
              >
                ENTRAR NO TERMINAL
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 font-sans p-4 md:p-6 relative selection:bg-[#18FF6D] selection:text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(24,255,109,0.012)_1px,transparent_1px),linear-gradient(to_right,rgba(24,255,109,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        
        {/* Header Admin */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0c0c10] border border-[#18FF6D22] p-5 rounded-2xl">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Alienware" className="w-10 h-10 drop-shadow-[0_0_10px_#18FF6D]" />
            <div className="text-left leading-none">
              <h1 className="text-lg font-bold tracking-tight text-white uppercase font-sans">
                ALIENWARE <span className="text-red-500">ADMIN CONTROL</span>
              </h1>
              <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">DATABASE SYNC TERMINAL</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProfiles}
              disabled={isLoading}
              className="p-2 bg-slate-900 border border-slate-800 hover:border-[#18FF6D44] text-[#18FF6D] rounded-xl transition cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-855 text-slate-400 rounded-xl transition font-mono text-2xs uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Sair do Painel
            </button>
          </div>
        </div>

        {/* Quick Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">USUÁRIOS CADASTRADOS</span>
              <h3 className="text-2xl font-bold font-sans mt-1">{totalUsers}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">SALDO COMPILADO (TOTAL)</span>
              <h3 className="text-2xl font-bold font-sans mt-1 text-[#18FF6D]">
                R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-[#18FF6D11] border border-[#18FF6D22] text-[#18FF6D] rounded-lg">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">NÓS DE MINERAÇÃO COMPRADOS</span>
              <h3 className="text-2xl font-bold font-sans mt-1 text-indigo-400">{totalRigs}</h3>
            </div>
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Users Table / List */}
        <div className="bg-[#0c0c10]/80 border border-slate-850 rounded-2xl p-6 shadow-xl">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-200">Lista Geral de Investidores</h4>
            <p className="text-3xs text-slate-500 font-mono">GERENCIAMENTO E CUSTOMIZAÇÃO DE SALDOS</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full font-mono text-2xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 text-left">
                  <th className="pb-3 font-semibold uppercase">Identificador / Gmail / Telefone</th>
                  <th className="pb-3 font-semibold uppercase">Saldo Ativo (PIX)</th>
                  <th className="pb-3 font-semibold uppercase">Nós Fleet</th>
                  <th className="pb-3 font-semibold uppercase">Criado Em</th>
                  <th className="pb-3 font-semibold uppercase text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500 animate-pulse">
                      Acessando a rede e buscando usuários do banco...
                    </td>
                  </tr>
                ) : profiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-600">
                      Nenhum usuário cadastrado encontrado no banco de dados.
                    </td>
                  </tr>
                ) : (
                  profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-slate-900/30 transition-all">
                      <td className="py-4 font-semibold text-slate-200">{profile.phone_or_email}</td>
                      <td className="py-4 font-bold text-[#18FF6D]">
                        R$ {Number(profile.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4">{formatRigsCount(profile.user_rigs)} ativos</td>
                      <td className="py-4 text-slate-500">
                        {new Date(profile.created_at).toLocaleDateString('pt-BR')} {new Date(profile.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingProfile(profile);
                            setNewBalance(profile.balance.toString());
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-[#18FF6D11] border border-slate-800 hover:border-[#18FF6D44] text-[#18FF6D] rounded transition font-mono text-3xs font-bold uppercase cursor-pointer"
                        >
                          Alterar Saldo
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Edit Balance Modal popup */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e12] border border-[#18FF6D44] rounded-2xl w-full max-w-sm p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#18FF6D] to-transparent shadow-[0_0_10px_#18FF6D]" />

            <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
              <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">EDITAR SALDO</span>
              <button onClick={() => setEditingProfile(null)} className="text-slate-500 hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBalance} className="space-y-4">
              <div className="space-y-1.5 font-mono text-2xs text-slate-400">
                <p>Usuário: <span className="text-slate-200">{editingProfile.phone_or_email}</span></p>
                <p>Saldo Atual: <span className="text-[#18FF6D] font-bold">R$ {Number(editingProfile.balance).toFixed(2)}</span></p>
              </div>

              <div className="space-y-1.5">
                <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">Novo Saldo (R$)</span>
                <div className="flex items-center gap-2 bg-[#121216] border border-slate-800 focus-within:border-[#18FF6D66] rounded-xl p-3.5">
                  <span className="text-xs font-mono text-slate-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 font-mono focus:outline-none w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={actionLoading === editingProfile.id}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-3xs font-bold uppercase rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-mono text-3xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
