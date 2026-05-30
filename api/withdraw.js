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

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseSecretKey) {
      return res.status(500).json({ success: false, message: 'Configuração do banco de dados ausente no servidor.' });
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // 1. Fetch user profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError || !profile) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    // 2. Check balance
    const currentBalance = Number(profile.balance);
    if (currentBalance < amount) {
      return res.status(400).json({ success: false, message: 'Saldo insuficiente para saque.' });
    }

    // 3. Deduct balance and create a PENDING transaction
    const updatedBalance = currentBalance - amount;

    const safeParseArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          console.error('[Withdraw Safety] Failed to parse stringified JSON column:', e);
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
      status: 'pending', // Pending manual review
      details: `Saque solicitado para Chave Pix: ${pixKey} (Aguardando Aprovação)`
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
      return res.status(500).json({ success: false, message: 'Falha ao processar solicitação de saque no banco.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Solicitação de saque de R$ ' + amount.toFixed(2) + ' enviada para análise do administrador com sucesso!'
    });

  } catch (error) {
    console.error('[Vercel Serverless] Payout Request Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no processamento do saque.' });
  }
}
