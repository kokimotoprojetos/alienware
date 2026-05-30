import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { amount, pixKey, userId } = req.body;
    if (!amount || isNaN(amount) || amount <= 0 || !pixKey || !userId) {
      return res.status(400).json({ success: false, message: 'Parâmetros de saque inválidos.' });
    }

    const IRONPAY_API_TOKEN = process.env.IRONPAY_API_TOKEN || '';
    const isMockMode = !IRONPAY_API_TOKEN || IRONPAY_API_TOKEN.includes('YOUR_IRONPAY_API_TOKEN');
    const amountInCentavos = Math.round(amount * 100);

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseSecretKey) {
      return res.status(500).json({ success: false, message: 'Configuração do banco de dados ausente no servidor.' });
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // 1. Fetch user's profile and check balance
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError || !profile) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    const currentBalance = Number(profile.balance);
    if (currentBalance < amount) {
      return res.status(400).json({ success: false, message: 'Saldo insuficiente para saque no banco de dados.' });
    }

    // 2. Deduct balance from DB first to prevent double-spend / race conditions
    const updatedBalance = currentBalance - amount;
    
    const safeParseArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          console.error('[Withdraw Supabase Safety] Failed to parse stringified JSON column:', e);
        }
      }
      return [];
    };

    const txs = safeParseArray(profile.transactions);
    const newTx = {
      id: `tx-withdraw-${Date.now()}`,
      type: 'withdraw',
      amount: amount,
      timestamp: Date.now(),
      status: 'completed',
      details: `Saque PIX enviado para Chave: ${pixKey}`
    };
    const updatedTxs = [newTx, ...txs];

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        balance: updatedBalance,
        transactions: updatedTxs
      })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ success: false, message: 'Falha ao debitar saldo do banco de dados.' });
    }

    if (isMockMode) {
      return res.status(200).json({
        success: true,
        mock: true,
        message: `Saque de R$ ${amount.toFixed(2)} processado com imediato sucesso na rede de transação!`
      });
    }

    // 3. Perform payout / withdrawal via IronPay
    try {
      // Register bank account / PIX key
      const bankResponse = await fetch('https://api.ironpayapp.com.br/api/public/v1/bank-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_token: IRONPAY_API_TOKEN,
          bank_name: 'Saque Pix Alienware',
          account_type: 'checking',
          account_number: '99999',
          branch_number: '0001',
          document_number: '12345678900',
          pix_key: pixKey
        })
      });

      const bankData = await bankResponse.json();
      if (!bankResponse.ok) {
        throw new Error(bankData.message || 'Erro ao registrar chave de saque no gateway.');
      }

      const bankAccountId = bankData.id;

      // Request withdrawal
      const payoutResponse = await fetch('https://api.ironpayapp.com.br/api/public/v1/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_token: IRONPAY_API_TOKEN,
          amount: amountInCentavos,
          bank_account_id: bankAccountId,
          description: `Saque Alienware Capital - Chave ${pixKey}`
        })
      });

      const payoutData = await payoutResponse.json();
      if (!payoutResponse.ok) {
        throw new Error(payoutData.message || 'Falha na execução do saque na IronPay.');
      }

      return res.status(200).json({
        success: true,
        message: `Saque de R$ ${amount.toFixed(2)} processado com imediato sucesso na rede de transação!`,
        payout: payoutData
      });

    } catch (gatewayError) {
      console.error('[Withdraw API] Gateway error, reverting database debit:', gatewayError);
      
      // Revert the debited balance in the database
      const revertedBalance = updatedBalance + amount;
      const revertedTxs = updatedTxs.filter(t => t.id !== newTx.id);
      
      await supabase
        .from('profiles')
        .update({
          balance: revertedBalance,
          transactions: revertedTxs
        })
        .eq('id', userId);

      return res.status(502).json({
        success: false,
        message: `Erro no gateway de pagamento: ${gatewayError.message}. Seu saldo foi devolvido.`
      });
    }

  } catch (error) {
    console.error('[Vercel Serverless] Payout Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no processamento do saque.' });
  }
}
