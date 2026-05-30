/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle, 
  QrCode, 
  Copy, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  CreditCard,
  Building,
  RefreshCw
} from 'lucide-react';

export default function WalletActions() {
  const { balance, depositFunds, withdrawFunds, transactions, user } = useSimulator();

  // Selected tab 'deposit' | 'withdraw'
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  // Deposit fields
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [depositStage, setDepositStage] = useState<'input' | 'qr_code'>('input');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGeneratingPix, setIsGeneratingPix] = useState<boolean>(false);
  const [pixPayloadString, setPixPayloadString] = useState<string>('');
  const [activeTxId, setActiveTxId] = useState<string>('');

  // Customer details for real deposit validation
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>(user?.phone_or_email || '');
  const [customerCpf, setCustomerCpf] = useState<string>('');

  // Withdraw fields
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50);
  const [pixKeyType, setPixKeyType] = useState<string>('cpf');
  const [pixKey, setPixKey] = useState<string>('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState<boolean>(false);
  const [withdrawFeedback, setWithdrawFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Monitor PIX payment status in real-time
  React.useEffect(() => {
    if (depositStage !== 'qr_code' || !activeTxId) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/status?txId=${activeTxId}`);
        const data = await response.json();
        if (isSubscribed && data.success && (data.status === 'paid' || data.status === 'approved' || data.status === 'completed')) {
          clearInterval(interval);
          depositFunds(depositAmount);
          setDepositStage('input');
          setActiveTxId('');
          alert(`Pagamento PIX de R$ ${depositAmount.toFixed(2)} confirmado com sucesso!`);
        }
      } catch (error) {
        console.error('Erro ao consultar status do PIX:', error);
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [depositStage, activeTxId, depositAmount, depositFunds]);

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixPayloadString);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGeneratePix = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      alert('Por favor, preencha seu Nome e E-mail para gerar a cobrança PIX.');
      return;
    }

    setIsGeneratingPix(true);
    try {
      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount: depositAmount,
          name: customerName,
          email: customerEmail,
          cpf: customerCpf
        })
      });
      const data = await response.json();
      if (data.success) {
        // Real checkout transaction returned by Lytron Pay has transaction details inside transaction.data or transaction
        // Let's fallback safely depending on payload mapping
        const tx = data.transaction;
        const code = (tx.pix && tx.pix.pix_qr_code) || tx.pix_code || (tx.data ? (tx.data.pix && tx.data.pix.pix_qr_code) || tx.data.pix_code : '') || '';
        const id = tx.hash || tx.id || (tx.data ? tx.data.hash || tx.data.id : '') || '';

        setPixPayloadString(code);
        setActiveTxId(id);
        setDepositStage('qr_code');
      } else {
        const detail = data.error ? JSON.stringify(data.error) : (data.message || 'Erro no servidor');
        alert('Erro ao gerar PIX: ' + detail);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao gerar o PIX.');
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey.trim()) return;

    setIsProcessingWithdraw(true);
    setWithdrawFeedback(null);

    const response = await withdrawFunds(withdrawAmount, pixKey);
    setIsProcessingWithdraw(false);
    setWithdrawFeedback(response);
    if (response.success) {
      setPixKey('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Wallet Selector Header Tabs */}
      <div className="bg-slate-905/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex gap-2 shadow-xl">
        <button
          onClick={() => {
            setActiveTab('deposit');
            setWithdrawFeedback(null);
          }}
          className={`flex-1 py-3 font-mono text-xs font-bold uppercase rounded-xl border flex items-center justify-center gap-2 transition duration-300 cursor-pointer ${
            activeTab === 'deposit'
              ? 'bg-cyan-500/10 border-cyan-500/60 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
              : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-cyan-400" />
          RECARREGAR / DEPÓSITO PIX
        </button>
        <button
          onClick={() => {
            setActiveTab('withdraw');
            setWithdrawFeedback(null);
          }}
          className={`flex-1 py-3 font-mono text-xs font-bold uppercase rounded-xl border flex items-center justify-center gap-2 transition duration-300 cursor-pointer ${
            activeTab === 'withdraw'
              ? 'bg-rose-500/10 border-rose-500/60 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
              : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-rose-400" />
          SAQUE IMEDIATO VIA PIX
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Dynamic actions inputs panel */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl leading-relaxed">
          
          {activeTab === 'deposit' ? (
            /* Tab: Deposit */
            <div className="space-y-5">
              
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-sm font-semibold text-slate-100 font-sans tracking-tight">Recarregar Saldo de Conta</h4>
                <p className="text-3xs text-slate-400">Adicione saldo instantâneo via PIX para adquirir novos nós de hardware.</p>
              </div>

              {depositStage === 'input' ? (
                /* Stage Input */
                <div className="space-y-4">
                  
                  {/* Preset Buttons */}
                  <div className="space-y-2">
                    <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">Valores Populares</span>
                    <div className="grid grid-cols-4 gap-2 font-mono text-2xs">
                      {[50, 100, 500, 2500].map((val) => (
                        <button
                          key={val}
                          onClick={() => setDepositAmount(val)}
                          className={`py-2 rounded-lg border text-center transition cursor-pointer ${
                            depositAmount === val
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/60 font-bold'
                              : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'
                          }`}
                        >
                          +R$ {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual input */}
                  <div className="space-y-2">
                    <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">Digitar Outro Valor (R$)</span>
                    <div className="flex items-center gap-2 bg-slate-955/80 border border-slate-800 rounded-xl p-3">
                      <span className="text-xs font-mono text-slate-500">R$</span>
                      <input
                        type="number"
                        min="10"
                        max="100000"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Math.max(10, Math.min(100000, Number(e.target.value))))}
                        className="bg-transparent text-sm text-slate-200 font-mono focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  {/* Customer Information inputs */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">Nome Completo</span>
                      <input
                        type="text"
                        placeholder="Nome do titular da conta"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-955/80 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">E-mail da Conta</span>
                      <input
                        type="email"
                        readOnly
                        placeholder="seuemail@exemplo.com"
                        value={customerEmail}
                        className="w-full bg-slate-950/80 border border-slate-900 rounded-xl p-3 text-slate-400 font-mono text-xs focus:outline-none cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">CPF (Opcional)</span>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={customerCpf}
                        onChange={(e) => setCustomerCpf(e.target.value)}
                        className="w-full bg-slate-955/80 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGeneratePix}
                    disabled={isGeneratingPix}
                    className="w-full py-3.5 bg-gradient-to-r from-cyan-505 via-cyan-500 to-indigo-650 hover:scale-101 hover:shadow-cyan-500/10 text-slate-950 font-mono text-xs font-bold tracking-wider uppercase rounded-xl transition duration-300 shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingPix ? 'SOLICITANDO TRANSACÃO NA MATRIX...' : 'GERAR COBRANÇA PIX'}
                  </button>

                </div>
              ) : (
                /* Stage QR CODE view */
                <div className="text-center space-y-5 py-2">
                  <div className="mx-auto w-40 h-40 bg-white p-2.5 rounded-xl border border-slate-800 flex items-center justify-center shadow-lg relative group">
                    <div className="absolute inset-0 bg-cyan-400/5 filter blur rounded-xl group-hover:scale-105 transition" />
                    {/* Render dynamic scanable QR code from payload */}
                    <div className="w-full h-full relative z-10 flex flex-col items-center justify-center bg-slate-100/10 border-2 border-dashed border-slate-400 rounded overflow-hidden">
                      {pixPayloadString ? (
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixPayloadString)}`} 
                          alt="PIX QR Code"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <>
                          <QrCode className="w-16 h-16 text-slate-900" />
                          <span className="text-5xs font-mono text-slate-600 mt-1 uppercase tracking-widest">Processando PIX Qr</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-2xs font-semibold text-slate-250 font-mono">PIX GERADO COM SUCESSO</h5>
                    <p className="text-3xs text-slate-400 max-w-sm mx-auto">
                      Escaneie o QR Code acima ou use o Copia e Cola para realizar o pagamento. O saldo será creditado automaticamente.
                    </p>
                  </div>

                  {/* Copy code input */}
                  <div className="flex bg-slate-950 border border-slate-850 p-2.5 rounded-xl max-w-sm mx-auto justify-between items-center gap-2">
                    <span className="text-4xs font-mono text-slate-500 truncate w-48 text-left">{pixPayloadString}</span>
                    <button
                      onClick={copyPixCode}
                      className="px-2 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 font-mono text-3xs text-slate-300 rounded uppercase flex items-center gap-1 shrink-0 transition cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      {isCopied ? 'COPIADO' : 'COPIAR'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 max-w-sm mx-auto flex flex-col gap-2">
                    <div className="py-2.5 bg-[#18FF6D]/15 border border-[#18FF6D44] text-[#18FF6D] font-mono text-3xs font-bold rounded uppercase tracking-wider flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      MONITORANDO PAGAMENTO AUTOMATICAMENTE...
                    </div>
                    <button
                      onClick={() => setDepositStage('input')}
                      className="py-2.5 bg-slate-850 border border-slate-750 text-slate-450 hover:text-slate-205 transition font-mono text-3xs rounded uppercase cursor-pointer"
                    >
                      VOLTAR E ALTERAR VALOR
                    </button>
                  </div>

                </div>
              )}

            </div>
          ) : (
            /* Tab: Withdraw */
            <div className="space-y-5">
              
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-sm font-semibold text-slate-100 font-sans tracking-tight">Retirar Rendimentos Acumulados</h4>
                <p className="text-3xs text-slate-400">Transfira seus rendimentos acumulados diretamente para sua chave PIX cadastrada.</p>
              </div>

              {withdrawFeedback ? (
                /* Withdraw processed success window */
                <div className="p-5 bg-slate-950 border border-emerald-500/20 rounded-xl text-center space-y-4 font-mono">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-2xs font-bold text-slate-200">SAQUE PROCESSADO COM SUCESSO</h5>
                    <p className="text-3xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {withdrawFeedback.message} O saldo foi debitado com êxito de sua carteira Alienware.
                    </p>
                  </div>
                  <button
                    onClick={() => setWithdrawFeedback(null)}
                    className="w-full max-w-xs py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 border border-slate-750 text-3xs rounded uppercase transition cursor-pointer"
                  >
                    REALIZAR OUTRO SAQUE
                  </button>
                </div>
              ) : (
                /* Withdrawal Input Form */
                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  
                  {/* Select Key Type */}
                  <div className="space-y-2">
                    <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">Selecione Tipo de Chave PIX</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-2xs">
                      {['cpf', 'email', 'telefone', 'aleatoria'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPixKeyType(type)}
                          className={`py-2 rounded-lg border text-center transition uppercase cursor-pointer ${
                            pixKeyType === type
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/60 font-bold'
                              : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'
                          }`}
                        >
                          {type === 'aleatoria' ? 'ALEATÓRIA' : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Key values */}
                  <div className="space-y-2">
                    <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">Insira Chave PIX</span>
                    <input
                      type="text"
                      required
                      placeholder={
                        pixKeyType === 'cpf' ? '000.000.000-00' :
                        pixKeyType === 'email' ? 'exemplo@alienware.com' :
                        pixKeyType === 'telefone' ? '(11) 99999-9999' : 'Chave aleatória UUID'
                      }
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full bg-slate-955/80 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Input amount */}
                  <div className="space-y-2">
                    <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest block">Valor do Saque (R$)</span>
                    <div className="flex items-center gap-2 bg-slate-955/80 border border-slate-800 rounded-xl p-3">
                      <span className="text-xs font-mono text-slate-500">R$</span>
                      <input
                        type="number"
                        min="20"
                        max="50000"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(Math.max(20, Math.min(balance, Number(e.target.value))))}
                        className="bg-transparent text-sm text-slate-200 font-mono focus:outline-none w-full"
                      />
                    </div>
                    <div className="flex justify-between items-center text-4xs font-mono text-slate-500">
                      <span>SALDO DISPONÍVEL: R$ {balance.toFixed(2)}</span>
                      <span>MÍNIMO DE SAQUE: R$ 20,00</span>
                    </div>
                  </div>

                  {/* Submit trigger button */}
                  <button
                    type="submit"
                    disabled={isProcessingWithdraw || balance < withdrawAmount || withdrawAmount < 20}
                    className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border cursor-pointer ${
                      isProcessingWithdraw
                        ? 'bg-slate-800 border-slate-800 text-slate-500'
                        : balance >= withdrawAmount && withdrawAmount >= 20
                        ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-pink-650 hover:scale-101 border-rose-400 text-slate-100 shadow-md shadow-rose-950/20'
                        : 'bg-slate-800/25 text-slate-500 border-slate-950 cursor-not-allowed'
                    }`}
                  >
                    {isProcessingWithdraw ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        PROCESSANDO TRANSAÇÃO PIX...
                      </>
                    ) : (
                      <>
                        <Building className="w-3.5 h-3.5" />
                        REQUISITAR SAQUE R$ {withdrawAmount.toFixed(2)}
                      </>
                    )}
                  </button>

                  {balance < withdrawAmount && (
                    <p className="text-center text-4xs font-mono text-rose-450 uppercase">
                      * Saldo em conta insuficiente para completar esta transferência.
                    </p>
                  )}

                </form>
              )}

            </div>
          )}

        </div>

        {/* Transaction History ledger list */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <span className="text-3xs font-mono text-slate-400 uppercase tracking-widest">Painel de Livro Caixa Ledger</span>
              <span className="text-4xs font-mono text-slate-600">ÚLTIMOS LANÇAMENTOS</span>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <div className="text-center py-10 font-mono text-slate-600 text-3xs">
                  Sem transações anotadas no banco de dados.
                </div>
              ) : (
                transactions.map((tx) => {
                  const isPositive = ['deposit', 'claim_yield', 'referral_bonus', 'checkin_bonus'].includes(tx.type);
                  
                  return (
                    <div key={tx.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between text-2xs font-mono">
                      <div className="flex items-center gap-2">
                        {isPositive ? (
                          <div className="p-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-1 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="leading-tight text-left">
                          <span className="text-slate-350 block capitalize font-sans font-medium">{tx.type.replace('_', ' ')}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 max-w-[150px] truncate block font-sans">{tx.details}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold block ${isPositive ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {isPositive ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                        </span>
                        <span className="text-4xs text-slate-600 block mt-0.5">
                          {new Date(tx.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <p className="text-4xs text-slate-500 font-mono pt-4 mt-4 border-t border-slate-800 text-center uppercase tracking-widest">
            Protocolo SSL SHA-256 Alienware Secured Ledger
          </p>

        </div>

      </div>

    </div>
  );
}
