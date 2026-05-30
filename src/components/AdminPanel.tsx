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
  password: string;
  balance: number;
  user_rigs: any;
  transactions: any;
  created_at: string;
}

export default function AdminPanel() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Users data states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit balance modal states
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');

  // Persist session check on mount
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      setIsAdminLoggedIn(true);
      setAdminToken(token);
      fetchProfiles(token);
    }
  }, []);

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

  // Compute Deposit and Withdrawal Stats
  let totalDeposited = 0;
  let totalPendingWithdrawAmount = 0;
  let totalApprovedWithdrawAmount = 0;

  profiles.forEach(profile => {
    try {
      const txs = typeof profile.transactions === 'string' ? JSON.parse(profile.transactions) : profile.transactions;
      const parsedTxs = Array.isArray(txs) ? txs : [];
      parsedTxs.forEach((tx: any) => {
        if (tx.type === 'deposit' && tx.status === 'completed') {
          totalDeposited += Number(tx.amount || 0);
        } else if (tx.type === 'withdraw') {
          if (tx.status === 'pending') {
            totalPendingWithdrawAmount += Number(tx.amount || 0);
          } else if (tx.status === 'completed') {
            totalApprovedWithdrawAmount += Number(tx.amount || 0);
          }
        }
      });
    } catch (e) {
      console.error('Failed to parse transactions for metrics calculation:', e);
    }
  });

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setIsAdminLoggedIn(true);
        setAdminToken(data.token);
        sessionStorage.setItem('admin_token', data.token);
        fetchProfiles(data.token);
      } else {
        setAuthError(data.message || 'Credenciais administrativas incorretas.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Erro de rede ao autenticar no servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfiles = async (tokenOverride?: string) => {
    const token = tokenOverride || adminToken || sessionStorage.getItem('admin_token');
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-profiles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Não foi possível buscar perfis.');
      }
      setProfiles(data.profiles || []);
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

    const token = adminToken || sessionStorage.getItem('admin_token');
    if (!token) {
      alert('Sessão administrativa expirada ou inválida. Por favor, logue novamente.');
      return;
    }

    setActionLoading(editingProfile.id);
    try {
      const response = await fetch('/api/admin-update-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: editingProfile.id, balance: parsedBalance })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao atualizar saldo.');
      }

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

  const handleApproveWithdraw = async (userId: string, txId: string) => {
    const token = adminToken || sessionStorage.getItem('admin_token');
    if (!token) return;

    if (!confirm('Deseja realmente APROVAR e marcar este saque como pago?')) return;

    setActionLoading(txId);
    try {
      const response = await fetch('/api/admin-approve-withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, txId })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao aprovar saque.');
      }
      alert('Saque aprovado com sucesso!');
      fetchProfiles(token);
    } catch (e: any) {
      console.error(e);
      alert('Erro: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithdraw = async (userId: string, txId: string) => {
    const token = adminToken || sessionStorage.getItem('admin_token');
    if (!token) return;

    if (!confirm('Deseja realmente RECUSAR este saque? O saldo do usuário será devolvido.')) return;

    setActionLoading(txId);
    try {
      const response = await fetch('/api/admin-reject-withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, txId })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao rejeitar saque.');
      }
      alert('Saque rejeitado e saldo reembolsado!');
      fetchProfiles(token);
    } catch (e: any) {
      console.error(e);
      alert('Erro: ' + e.message);
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

  // Find all pending withdrawals across all users
  const pendingWithdrawals: {
    userId: string;
    phone_or_email: string;
    txId: string;
    amount: number;
    details: string;
    timestamp: number;
  }[] = [];

  profiles.forEach(profile => {
    try {
      const txs = typeof profile.transactions === 'string' ? JSON.parse(profile.transactions) : profile.transactions;
      const parsedTxs = Array.isArray(txs) ? txs : [];
      parsedTxs.forEach((tx: any) => {
        if (tx.type === 'withdraw' && tx.status === 'pending') {
          pendingWithdrawals.push({
            userId: profile.id,
            phone_or_email: profile.phone_or_email,
            txId: tx.id,
            amount: tx.amount,
            details: tx.details,
            timestamp: tx.timestamp
          });
        }
      });
    } catch (e) {
      console.error('Failed to parse transactions for pending withdrawals check:', e);
    }
  });

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
              onClick={() => fetchProfiles()}
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

          {/* Row 2: Deposit and Payout Stats */}
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">TOTAL DEPOSITADO (PIX)</span>
              <h3 className="text-2xl font-bold font-sans mt-1 text-emerald-400">
                R$ {totalDeposited.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">VALOR PENDENTE SAQUE</span>
              <h3 className="text-2xl font-bold font-sans mt-1 text-amber-500">
                R$ {totalPendingWithdrawAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">VALOR APROVADO & PAGO</span>
              <h3 className="text-2xl font-bold font-sans mt-1 text-[#18FF6D]">
                R$ {totalApprovedWithdrawAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-[#18FF6D11] border border-[#18FF6D22] text-[#18FF6D] rounded-lg">
              <Coins className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Pending Payout requests section */}
        {pendingWithdrawals.length > 0 && (
          <div className="bg-[#0c0c10]/80 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-sm font-semibold text-amber-450 uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Solicitações de Saque Pendentes ({pendingWithdrawals.length})
                </h4>
                <p className="text-3xs text-slate-450 font-mono">GERENCIAMENTO E PAGAMENTO EXCLUSIVO PELO PORTAL DE SAQUES</p>
              </div>
              <button
                onClick={() => window.location.href = '/pendentes'}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono text-3xs font-bold uppercase rounded-xl transition duration-300 shadow-md shadow-amber-950/20 cursor-pointer"
              >
                Acessar Painel /pendentes
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-2xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 text-left">
                    <th className="pb-3 font-semibold uppercase">Investidor</th>
                    <th className="pb-3 font-semibold uppercase">Valor Solicitado</th>
                    <th className="pb-3 font-semibold uppercase">Detalhes da Chave</th>
                    <th className="pb-3 font-semibold uppercase">Horário da Ordem</th>
                    <th className="pb-3 font-semibold uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-slate-300">
                  {pendingWithdrawals.map((withdraw) => (
                    <tr key={withdraw.txId} className="hover:bg-slate-900/30 transition-all">
                      <td className="py-4 font-semibold text-slate-200">{withdraw.phone_or_email}</td>
                      <td className="py-4 font-bold text-rose-450">
                        R$ {Number(withdraw.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 text-slate-400">{withdraw.details}</td>
                      <td className="py-4 text-slate-500">
                        {new Date(withdraw.timestamp).toLocaleDateString('pt-BR')} {new Date(withdraw.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="py-4 text-right">
                        <span className="px-2 py-0.5 rounded text-4xs font-bold uppercase bg-amber-950/40 text-amber-400 border border-amber-500/20">
                          Pendente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                  <th className="pb-3 font-semibold uppercase">Senha</th>
                  <th className="pb-3 font-semibold uppercase">Saldo Ativo (PIX)</th>
                  <th className="pb-3 font-semibold uppercase">Nós Fleet</th>
                  <th className="pb-3 font-semibold uppercase">Criado Em</th>
                  <th className="pb-3 font-semibold uppercase text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 animate-pulse">
                      Acessando a rede e buscando usuários do banco...
                    </td>
                  </tr>
                ) : profiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-600">
                      Nenhum usuário cadastrado encontrado no banco de dados.
                    </td>
                  </tr>
                ) : (
                  profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-slate-900/30 transition-all">
                      <td className="py-4 font-semibold text-slate-200">{profile.phone_or_email}</td>
                      <td className="py-4 text-[#18FF6D] font-bold select-all">{profile.password}</td>
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
