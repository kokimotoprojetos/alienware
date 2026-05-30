/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import logo from '../logo.png';
import { SimulatorProvider, useSimulator } from './context/SimulatorContext';
import Dashboard from './components/Dashboard';
import RigStore from './components/RigStore';
import MyFleet from './components/MyFleet';
import WalletActions from './components/WalletActions';
import Referrals from './components/Referrals';
import AuthPage from './components/AuthPage';
import { 
  BarChart3, 
  Cpu, 
  Database, 
  Wallet, 
  Users, 
  Maximize2, 
  Compass, 
  Coins, 
  Zap, 
  Thermometer, 
  CheckCircle,
  Clock,
  LogOut
} from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'store' | 'fleet' | 'wallet' | 'referrals'>('dashboard');
  const [systemTime, setSystemTime] = useState<string>('');
  
  const { balance, balanceInvested, userRigs, user, logout } = useSimulator();

  // Tick local real-world clock for futuristic dashboard feeling
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString('pt-BR', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Redirect to AuthPage if user session not active
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 flex flex-col font-sans relative overflow-x-hidden antialiased selection:bg-[#18FF6D] selection:text-slate-950">
      
      {/* Absolute cybergrid ambient overlay with green laser beams */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(24,255,109,0.015)_1px,transparent_1px),linear-gradient(to_right,rgba(24,255,109,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#18FF6D]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#18FF6D]/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main futuristic Header bar */}
      <header className="sticky top-0 z-40 bg-[#060608]/90 backdrop-blur-md border-b border-[#18FF6D22] p-4 text-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand with glowing SVG Alien Header */}
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Alienware Logo" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_15px_#18FF6D] animate-pulse cursor-pointer hover:scale-105 transition duration-300"
            />
            <div className="text-left leading-none">
              <h1 className="text-xl font-bold tracking-tighter text-white uppercase font-sans">
                ALIENWARE <span className="text-[#18FF6D]">CAPITAL</span>
              </h1>
              <span className="text-[9px] text-[#18FF6D]/70 font-mono tracking-widest uppercase">INVEST MATRIX v2.4</span>
            </div>
          </div>

          {/* Quick Stats telemetry widgets in middleheader */}
          <div className="hidden lg:flex items-center gap-6 font-mono text-3xs text-slate-400">
            
            <div className="flex items-center gap-1.5 border-r border-slate-800 pr-5">
              <Clock className="w-3.5 h-3.5 text-[#18FF6D]" />
              <div>
                <span className="text-slate-650 block text-[9px]">HORÁRIO DA MATRIX</span>
                <span className="text-slate-300">{systemTime || 'CONECTANDO..'} UTC</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 border-r border-[#18FF6D22] pr-5">
              <Thermometer className="w-3.5 h-3.5 text-[#18FF6D] animate-pulse" />
              <div>
                <span className="text-slate-650 block text-[9px]">REFRIGERAÇÃO CORE</span>
                <span className="text-[#18FF6D] font-bold">CPU: 42°C | FAN: 2400 RPM</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-[#18FF6D]" />
              <div>
                <span className="text-slate-650 block text-[9px]">FROTA COMPUTACIONAL</span>
                <span className="text-[#18FF6D] font-bold uppercase">{userRigs.length} nós ativos</span>
              </div>
            </div>

          </div>

          {/* Balance Tracker top box */}
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-[#18FF6D]">Total Net Worth</span>
              <span className="text-lg font-mono font-bold text-white">
                R$ {(balance + balanceInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-[#121214] px-4 py-2 rounded-xl border border-[#18FF6D44] text-right">
              <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-wider">SALDO ATIVO PIX</span>
              <span className="text-xs font-mono font-bold text-[#18FF6D]">
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="w-10 h-10 rounded-lg border border-[#18FF6D44] bg-[#18FF6D11] flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#18FF6D] rounded-full animate-pulse shadow-[0_0_10px_#18FF6D]"></div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Layout Area */}
      <main className="max-w-7xl w-full mx-auto p-4 pb-24 md:pb-6 md:p-6 flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Navigation panel */}
        <aside className="fixed bottom-0 left-0 right-0 z-50 bg-[#060608]/95 backdrop-blur-md border-t border-[#18FF6D22] p-2 md:p-0 md:relative md:bottom-auto md:left-auto md:right-auto md:z-0 md:bg-transparent md:border-t-0 md:w-64 md:shrink-0 md:flex md:flex-col md:gap-4">
          <nav className="grid grid-cols-5 md:flex md:flex-col gap-1 md:gap-2 w-full">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-1.5 md:px-5 md:py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-wider border transition-all duration-300 cursor-pointer w-full text-center md:text-left truncate shrink-0 md:shrink-none ${
                activeTab === 'dashboard'
                  ? 'bg-[#18FF6D11] border-l-2 md:border-l-2 border-l-[#18FF6D] text-[#18FF6D] shadow-[0_0_15px_rgba(24,255,109,0.15)] border-[#18FF6D44]'
                  : 'bg-[#121214]/40 text-gray-400 border-[#2A2A2E]/55 hover:bg-[#121214] hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Command Center</span>
              <span className="inline md:hidden text-[8px] tracking-tight">Painel</span>
            </button>

            <button
              onClick={() => setActiveTab('store')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-1.5 md:px-5 md:py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-wider border transition-all duration-300 cursor-pointer w-full text-center md:text-left truncate shrink-0 md:shrink-none ${
                activeTab === 'store'
                  ? 'bg-[#18FF6D11] border-l-2 md:border-l-2 border-l-[#18FF6D] text-[#18FF6D] shadow-[0_0_15px_rgba(24,255,109,0.15)] border-[#18FF6D44]'
                  : 'bg-[#121214]/40 text-gray-400 border-[#2A2A2E]/55 hover:bg-[#121214] hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">NÓS DE HARDWARE</span>
              <span className="inline md:hidden text-[8px] tracking-tight">Loja</span>
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-1.5 md:px-5 md:py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-wider border transition-all duration-300 cursor-pointer relative w-full text-center md:text-left truncate shrink-0 md:shrink-none ${
                activeTab === 'fleet'
                  ? 'bg-[#18FF6D11] border-l-2 md:border-l-2 border-l-[#18FF6D] text-[#18FF6D] shadow-[0_0_15px_rgba(24,255,109,0.15)] border-[#18FF6D44]'
                  : 'bg-[#121214]/40 text-gray-400 border-[#2A2A2E]/55 hover:bg-[#121214] hover:text-white'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">MINHA FROTA</span>
              <span className="inline md:hidden text-[8px] tracking-tight">Frota</span>
              {userRigs.length > 0 && (
                <span className="absolute top-1 md:top-1/2 md:-translate-y-1/2 right-1 md:right-4 px-1.5 py-0.5 rounded bg-[#18FF6D] text-black font-mono text-[8px] font-bold">
                  {userRigs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-1.5 md:px-5 md:py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-wider border transition-all duration-300 cursor-pointer w-full text-center md:text-left truncate shrink-0 md:shrink-none ${
                activeTab === 'wallet'
                  ? 'bg-[#18FF6D11] border-l-2 md:border-l-2 border-l-[#18FF6D] text-[#18FF6D] shadow-[0_0_15px_rgba(24,255,109,0.15)] border-[#18FF6D44]'
                  : 'bg-[#121214]/40 text-gray-400 border-[#2A2A2E]/55 hover:bg-[#121214] hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">CARTEIRA & SAQUE</span>
              <span className="inline md:hidden text-[8px] tracking-tight">Carteira</span>
            </button>

            <button
              onClick={() => setActiveTab('referrals')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-1.5 md:px-5 md:py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-wider border transition-all duration-300 cursor-pointer w-full text-center md:text-left truncate shrink-0 md:shrink-none ${
                activeTab === 'referrals'
                  ? 'bg-[#18FF6D11] border-l-2 md:border-l-2 border-l-[#18FF6D] text-[#18FF6D] shadow-[0_0_15px_rgba(24,255,109,0.15)] border-[#18FF6D44]'
                  : 'bg-[#121214]/40 text-gray-400 border-[#2A2A2E]/55 hover:bg-[#121214] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">MÁQUINA DIRETA</span>
              <span className="inline md:hidden text-[8px] tracking-tight">Indicar</span>
            </button>

            <button
              onClick={logout}
              className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-1.5 md:px-5 md:py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-wider border border-red-500/20 bg-red-950/10 text-red-400 hover:bg-red-900/20 transition-all duration-300 cursor-pointer w-full text-center md:text-left truncate shrink-0 md:shrink-none mt-2"
            >
              <LogOut className="w-4 h-4 shrink-0 text-red-450" />
              <span className="hidden md:inline font-sans text-red-400">Desconectar</span>
              <span className="inline md:hidden text-[8px] tracking-tight text-red-400">Sair</span>
            </button>

          </nav>

          {/* System Health sidebar widget strictly matching Design HTML structure */}
          <div className="hidden md:block mt-auto">
            <div className="p-4 rounded-xl bg-gradient-to-t from-[#18FF6D11] to-transparent border border-[#18FF6D33]">
              <p className="text-[10px] uppercase text-[#18FF6D] mb-1 tracking-widest font-mono">System Health</p>
              <div className="h-1.5 w-full bg-[#121214] rounded-full overflow-hidden border border-[#2a2a2e]">
                <div className="h-full w-[94%] bg-[#18FF6D] shadow-[0_0_8px_#18FF6D]"></div>
              </div>
              <p className="text-[9px] text-gray-400 mt-2 font-mono">CPU: 42°C | FAN: 2400 RPM</p>
            </div>
          </div>
        </aside>

        {/* Dynamic subcomponent screen content panel */}
        <div className="flex-1 min-w-0 md:p-1 pt-5 md:pt-0 bg-[radial-gradient(circle_at_50%_0%,#18FF6D08_0%,transparent_70%)]">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'store' && <RigStore />}
          {activeTab === 'fleet' && <MyFleet />}
          {activeTab === 'wallet' && <WalletActions />}
          {activeTab === 'referrals' && <Referrals />}
        </div>

      </main>

      {/* Footer system indicators */}
      <footer className="border-t border-[#18FF6D11] bg-black/80 py-4 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-3xs font-mono text-gray-500">
          <p className="text-left leading-relaxed">
            PLATAFORMA INTEGRADA ALIENWARE CAPITAL SYSTEM. © 2026 ALIENWARE INTEL COOPERATIVE. <br />
            PROCESSAMENTO DE HASHRATE E CUSTÓDIA DIÁRIA DE RENDIMENTOS ALIENWARE CAPITAL.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[#18FF6D] flex items-center gap-2 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 bg-[#18FF6D] rounded-full animate-pulse shadow-[0_0_6px_#18FF6D]" />
              Quantum Core Node Active & Secured
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[React Error Boundary] Crashed:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('aw_logged_user');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060608] text-slate-100 flex flex-col items-center justify-center font-sans p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(24,255,109,0.015)_1px,transparent_1px),linear-gradient(to_right,rgba(24,255,109,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full filter blur-[120px] pointer-events-none" />
          
          <div className="w-full max-w-lg bg-[#0e0e12] border border-red-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden z-10">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_10px_#ef4444]" />
            
            <div className="text-center mb-6">
              <span className="text-3xl">⚠️</span>
              <h2 className="text-lg font-bold tracking-tighter text-white uppercase mt-2">
                CRASH DO SISTEMA <span className="text-red-500">ALIENWARE</span>
              </h2>
              <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">
                EXCEÇÃO DETECTADA NA MATRIX
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-3xs text-red-400 space-y-2 overflow-x-auto max-h-48">
              <p className="font-bold">MENSAGEM DE ERRO:</p>
              <pre className="whitespace-pre-wrap">{this.state.error?.message || 'Erro desconhecido'}</pre>
              {this.state.error?.stack && (
                <>
                  <p className="font-bold mt-2">STACK TRACE:</p>
                  <pre className="whitespace-pre-wrap text-slate-500">{this.state.error.stack}</pre>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 bg-red-650 hover:bg-red-600 text-white font-mono text-2xs font-bold uppercase rounded-xl transition duration-300 shadow-md shadow-red-950/20 cursor-pointer text-center"
              >
                LIMPAR CACHE E VOLTAR
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 font-mono text-2xs uppercase rounded-xl border border-slate-800 transition duration-300 cursor-pointer text-center"
              >
                RECARREGAR PÁGINA
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import AdminPanel from './components/AdminPanel';

export default function App() {
  const [isAdminPath, setIsAdminPath] = useState<boolean>(false);

  useEffect(() => {
    if (window.location.pathname === '/gozei') {
      setIsAdminPath(true);
    }
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('aw_referrer', ref);
    }
  }, []);

  if (isAdminPath) {
    return (
      <ErrorBoundary>
        <AdminPanel />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SimulatorProvider>
        <AppContent />
      </SimulatorProvider>
    </ErrorBoundary>
  );
}
