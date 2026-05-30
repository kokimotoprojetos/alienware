import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    console.log('[LytronPay Webhook] Recebido evento do gateway:', JSON.stringify(payload, null, 2));

    const signature = req.headers['x-signature'] || req.headers['x-gateway-signature'];
    const secretHash = process.env.LYTRONPAY_WEBHOOK_SECRET || process.env.LYTRONPAY_SECRET_HASH || '';

    // Validate webhook signature if signature header and secret are configured
    if (signature && secretHash) {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      
      // Handle signature format if it contains prefix like sha256=
      const cleanSignature = signature.startsWith('sha256=') ? signature.split('=')[1] : signature;
      
      const expectedSignature = crypto
        .createHmac('sha256', secretHash)
        .update(rawBody)
        .digest('hex');

      if (cleanSignature !== expectedSignature) {
        console.warn('[LytronPay Webhook] Assinatura inválida detectada.');
        // We log warning but proceed or return error. Returning 401 is safest, but to bypass minor parsing discrepancy we can allow proceed if match fails but credentials match. Let's return 401 for safety.
        return res.status(401).json({ success: false, message: 'Assinatura inválida.' });
      }
    }

    const { event, txid, amount, status } = payload;

    // Check if the event is payment confirmation
    if (event === 'charge.paid' || status === 'paid' || status === 'completed') {
      if (!txid) {
        return res.status(400).json({ success: false, message: 'ID de transação (txid) ausente.' });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
      const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseSecretKey) {
        console.error('[LytronPay Webhook] Erro de configuração: Supabase credentials missing.');
        return res.status(500).json({ success: false, message: 'Supabase credentials missing on server.' });
      }

      const supabase = createClient(supabaseUrl, supabaseSecretKey);

      // Fetch profiles to find the transaction
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*');

      if (fetchError || !profiles) {
        console.error('[LytronPay Webhook] Erro ao buscar perfis:', fetchError);
        return res.status(500).json({ success: false, message: 'Erro de banco de dados.' });
      }

      // Safe parse transactions array
      const safeParseArray = (val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch (e) {}
        }
        return [];
      };

      // Find the profile containing the txid in transactions
      let profile = null;
      let transactionsList = [];

      for (const p of profiles) {
        const txs = safeParseArray(p.transactions);
        if (txs.some(t => t.id === `tx-gate-${txid}`)) {
          profile = p;
          transactionsList = txs;
          break;
        }
      }

      if (!profile) {
        console.warn(`[LytronPay Webhook] Transação ${txid} não encontrada em nenhum perfil.`);
        return res.status(404).json({ success: false, message: 'Transação não encontrada.' });
      }

      // Check if transaction is already completed to avoid double-crediting
      const existingTx = transactionsList.find(t => t.id === `tx-gate-${txid}`);
      if (existingTx && existingTx.status === 'completed') {
        console.log(`[LytronPay Webhook] Transação ${txid} já foi confirmada anteriormente.`);
        return res.status(200).json({ success: true, message: 'Transação já processada.' });
      }

      const depositAmount = Number(amount || existingTx.amount);
      
      // Determine if this is the first completed deposit
      const hasCompletedDeposit = transactionsList.some(t => t.type === 'deposit' && t.status === 'completed');
      const bonus = !hasCompletedDeposit ? 5.00 : 0;
      
      const updatedBalance = Number(profile.balance) + depositAmount + bonus;

      // Update transaction status to completed
      let updatedTxs = transactionsList.map(t => {
        if (t.id === `tx-gate-${txid}`) {
          return {
            ...t,
            status: 'completed',
            details: 'Depósito PIX Confirmado'
          };
        }
        return t;
      });

      if (bonus > 0) {
        updatedTxs = [
          {
            id: `tx-bonus-${Date.now()}`,
            type: 'referral_bonus',
            amount: bonus,
            timestamp: Date.now(),
            status: 'completed',
            details: 'Bônus de Primeiro Depósito!'
          },
          ...updatedTxs
        ];
      }

      // Persist balance and transactions update
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          balance: updatedBalance,
          transactions: updatedTxs
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('[LytronPay Webhook] Erro ao atualizar perfil no Supabase:', updateError);
        return res.status(500).json({ success: false, message: 'Erro ao atualizar saldo.' });
      }

      console.log(`[LytronPay Webhook] Saldo do usuário ${profile.phone_or_email} atualizado com sucesso. R$ ${depositAmount} creditados. Bônus de primeiro depósito: R$ ${bonus}.`);
    }

    return res.status(200).json({ success: true, message: 'Webhook processado com sucesso.' });
  } catch (error) {
    console.error('[LytronPay Webhook] Erro ao processar webhook:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao processar webhook.' });
  }
}
