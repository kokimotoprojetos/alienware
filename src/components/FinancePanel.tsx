/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Lock, 
  ShieldAlert, 
  RefreshCw, 
  Check, 
  X,
  Database,
  ArrowLeft,
  DollarSign,
  Clock,
  ArrowDownLeft
} from 'lucide-react';
import logo from '../../logo.png';

interface Profile {
  id: string;
  phone_or_email: string;
  transactions: any;
  created_at: string;
}

export default function FinancePanel() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Data states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Persist session check on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('finance_token');
    if (savedToken) {
      setIsLoggedIn(true);
      setToken(savedToken);
      fetchProfiles(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setIsLoggedIn(true);
        setToken(data.token);
        sessionStorage.setItem('finance_token', data.token);
        fetchProfiles(data.token);
      } else {
        setAuthError(data.message || 'Credenciais financeiras incorretas.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Erro de rede ao conectar.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfiles = async (tokenOverride?: string) => {
    const activeToken = tokenOverride || token || sessionStorage.getItem('finance_token');
    if (!activeToken) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-profiles', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao buscar dados.');
      }
      setProfiles(data.profiles || []);
    } catch (e: any) {
      console.error(e);
      alert('Erro ao carregar dados: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string, txId: string) => {
    const activeToken = token || sessionStorage.getItem('finance_token');
    if (!activeToken) return;

    if (!confirm('Deseja realmente APROVAR e marcar este saque como pago?')) return;

    setActionLoading(txId);
    try {
      const response = await fetch('/api/admin-approve-withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ userId, txId })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao aprovar saque.');
      }
      alert('Saque aprovado com sucesso!');
      fetchProfiles(activeToken);
    } catch (e: any) {
      console.error(e);
      alert('Erro: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string, txId: string) => {
    const activeToken = token || sessionStorage.getItem('finance_token');
    if (!activeToken) return;

    if (!confirm('Deseja realmente RECUSAR este saque? O saldo será devolvido ao usuário.')) return;

    setActionLoading(txId);
    try {
      const response = await fetch('/api/admin-reject-withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ userId, txId })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao rejeitar saque.');
      }
      alert('Saque rejeitado e saldo reembolsado!');
      fetchProfiles(activeToken);
    } catch (e: any) {
      console.error(e);
      alert('Erro: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Find all pending withdrawals across all users
  const pendingWithdrawals: {
    userId: string;
    phone_or_email: string;
    txId: string;
    amount: number;
    details: string;
    timestamp: number;
  }[] = [];

  // Find all completed withdrawals to show history
  const completedWithdrawals: {
    phone_or_email: string;
    txId: string;
    amount: number;
    details: string;
    timestamp: number;
    status: string;
  }[] = [];

  profiles.forEach(profile => {
    try {
      const txs = typeof profile.transactions === 'string' ? JSON.parse(profile.transactions) : profile.transactions;
      const parsedTxs = Array.isArray(txs) ? txs : [];
      parsedTxs.forEach((tx: any) => {
        if (tx.type === 'withdraw') {
          const item = {
            userId: profile.id,
            phone_or_email: profile.phone_or_email,
            txId: tx.id,
            amount: tx.amount,
            details: tx.details,
            timestamp: tx.timestamp,
            status: tx.status
          };
          if (tx.status === 'pending') {
            pendingWithdrawals.push(item);
          } else {
            completedWithdrawals.push(item);
          }
        }
      });
    } catch (e) {
      console.error('Failed to parse transactions:', e);
    }
  });

  // Sort by date
  pendingWithdrawals.sort((a, b) => b.timestamp - a.timestamp);
  completedWithdrawals.sort((a, b) => b.timestamp - a.timestamp);

  const totalPendingAmount = pendingWithdrawals.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalCompletedAmount = completedWithdrawals.filter(w => w.status === 'completed').reduce((acc, curr) => acc + Number(curr.amount), 0);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#060608] text-slate-100 flex flex-col items-center justify-center font-sans relative p-4 selection:bg-[#18FF6D] selection:text-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(24,255,109,0.015)_1px,transparent_1px),linear-gradient(to_right,rgba(24,255,109,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-6">
            <img src={logo} alt="Alienware" className="w-14 h-14 mx-auto mb-2 drop-shadow-[0_0_15px_#18FF6D]" />
            <h2 className="text-xl font-bold tracking-tighter uppercase text-white">
              FINANCE PORTAL <span className="text-[#18FF6D]">PAYOUTS</span>
            </h2>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">CONTROLE DE TRANSFERÊNCIAS PIX</p>
          </div>

          <div className="bg-[#0e0e12] border border-amber-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">ADMIN USER</span>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#121216]/90 border border-slate-800 focus:border-amber-500/50 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">ADMIN PASSWORD</span>
                <div className="relative flex items-center bg-[#121216]/90 border border-slate-800 focus-within:border-amber-500/50 rounded-xl p-3">
                  <Lock className="w-3.5 h-3.5 text-slate-500 mr-2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black font-mono text-2xs font-bold uppercase rounded-xl transition duration-300 shadow-md shadow-amber-950/20 cursor-pointer"
              >
                AUTENTICAR FINANCEIRO
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
                ALIENWARE <span className="text-[#18FF6D]">PAYOUT PORTAL</span>
              </h1>
              <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">FINANCIAL LEDGER CONTROL</span>
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
              Voltar ao Site
            </button>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">SAQUES AGUARDANDO</span>
              <h3 className="text-2xl font-bold font-sans mt-1 text-amber-500">{pendingWithdrawals.length} Ordens</h3>
            </div>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">TOTAL PENDENTE PIX</span>
              <h3 className="text-2xl font-bold font-sans mt-1 text-rose-500">
                R$ {totalPendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-lg">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">TOTAL APROVADO & PAGO</span>
              <h3 className="text-2xl font-bold font-sans mt-1 text-[#18FF6D]">
                R$ {totalCompletedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-[#18FF6D11] border border-[#18FF6D22] text-[#18FF6D] rounded-lg">
              <Coins className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Pending Withdrawals Queue */}
        <div className="bg-[#0c0c10]/80 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-amber-450 uppercase flex items-center gap-1.5">
              Fila de Saques Pendentes ({pendingWithdrawals.length})
            </h4>
            <p className="text-3xs text-slate-450 font-mono">AUTORIZE OU CANCELE AS TRANSFERÊNCIAS DE CRÉDITO DE INVESTIMENTOS</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full font-mono text-2xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 text-left">
                  <th className="pb-3 font-semibold uppercase">Investidor</th>
                  <th className="pb-3 font-semibold uppercase">Valor Solicitado</th>
                  <th className="pb-3 font-semibold uppercase">Destinatário / Chave Pix</th>
                  <th className="pb-3 font-semibold uppercase">Data do Pedido</th>
                  <th className="pb-3 font-semibold uppercase text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500 animate-pulse">
                      Carregando fila de saques da rede...
                    </td>
                  </tr>
                ) : pendingWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-600">
                      Nenhuma solicitação de saque aguardando processamento.
                    </td>
                  </tr>
                ) : (
                  pendingWithdrawals.map((withdraw) => (
                    <tr key={withdraw.txId} className="hover:bg-slate-900/30 transition-all">
                      <td className="py-4 font-semibold text-slate-200">{withdraw.phone_or_email}</td>
                      <td className="py-4 font-bold text-rose-400">
                        R$ {Number(withdraw.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 text-slate-400 select-all font-sans">{withdraw.details}</td>
                      <td className="py-4 text-slate-500">
                        {new Date(withdraw.timestamp).toLocaleDateString('pt-BR')} {new Date(withdraw.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button
                          onClick={() => handleApprove(withdraw.userId, withdraw.txId)}
                          disabled={actionLoading === withdraw.txId}
                          className="px-2.5 py-1 bg-emerald-950/20 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 rounded transition font-mono text-3xs font-bold uppercase cursor-pointer disabled:opacity-50"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(withdraw.userId, withdraw.txId)}
                          disabled={actionLoading === withdraw.txId}
                          className="px-2.5 py-1 bg-rose-950/20 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500 text-rose-400 rounded transition font-mono text-3xs font-bold uppercase cursor-pointer disabled:opacity-50"
                        >
                          Recusar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Processed Payouts History */}
        <div className="bg-[#0c0c10]/80 border border-slate-850 rounded-2xl p-6 shadow-xl">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-200">Histórico de Saques Processados</h4>
            <p className="text-3xs text-slate-500 font-mono">ÚLTIMOS LANÇAMENTOS DE SAQUE CONCLUÍDOS OU REJEITADOS</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full font-mono text-2xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 text-left">
                  <th className="pb-3 font-semibold uppercase">Investidor</th>
                  <th className="pb-3 font-semibold uppercase">Valor do Lançamento</th>
                  <th className="pb-3 font-semibold uppercase">Status</th>
                  <th className="pb-3 font-semibold uppercase">Chave / Descrição</th>
                  <th className="pb-3 font-semibold uppercase text-right">Horário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500 animate-pulse">
                      Carregando histórico...
                    </td>
                  </tr>
                ) : completedWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-650">
                      Nenhum saque processado no histórico.
                    </td>
                  </tr>
                ) : (
                  completedWithdrawals.slice(0, 15).map((withdraw) => (
                    <tr key={withdraw.txId} className="hover:bg-slate-900/30 transition-all opacity-80">
                      <td className="py-4 font-semibold text-slate-300">{withdraw.phone_or_email}</td>
                      <td className="py-4 font-bold text-slate-200">
                        R$ {Number(withdraw.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-4xs font-bold uppercase ${
                          withdraw.status === 'completed' 
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                        }`}>
                          {withdraw.status === 'completed' ? 'Aprovado' : 'Recusado'}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500 font-sans">{withdraw.details}</td>
                      <td className="py-4 text-slate-500 text-right">
                        {new Date(withdraw.timestamp).toLocaleDateString('pt-BR')} {new Date(withdraw.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
