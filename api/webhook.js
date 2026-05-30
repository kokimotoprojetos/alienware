import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    console.log('[IronPay Webhook] Recebido postback do gateway:', JSON.stringify(payload, null, 2));

    const status = payload.status;
    const amountInCentavos = payload.amount;
    const customerEmail = payload.customer?.email;

    // Check if payment is successful
    if (status === 'paid' || status === 'approved' || status === 'completed') {
      if (!customerEmail) {
        return res.status(400).json({ success: false, message: 'E-mail do cliente não fornecido no payload.' });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
      const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseSecretKey) {
        console.error('[IronPay Webhook] Erro de configuração: Supabase credentials missing.');
        return res.status(500).json({ success: false, message: 'Supabase credentials missing on server.' });
      }

      const supabase = createClient(supabaseUrl, supabaseSecretKey);

      // Find user profile by email/phone
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_or_email', customerEmail)
        .maybeSingle();

      if (fetchError || !profile) {
        console.warn(`[IronPay Webhook] Usuário não encontrado no banco de dados para o email: ${customerEmail}`);
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      const depositAmount = Number(amountInCentavos) / 100;
      const updatedBalance = Number(profile.balance) + depositAmount;

      // Safe parse transactions array
      const safeParseArray = (val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch (e) {
            console.error('[Webhook Supabase Safety] Failed to parse stringified JSON column:', e);
          }
        }
        return [];
      };

      const txs = safeParseArray(profile.transactions);
      
      // Check if this transaction hash was already processed to prevent double crediting
      const txHash = payload.hash || payload.id;
      if (txs.some(t => t.id === `tx-gate-${txHash}`)) {
        console.log(`[IronPay Webhook] Transação ${txHash} já processada anteriormente.`);
        return res.status(200).json({ success: true, message: 'Transação já processada.' });
      }

      const newTx = {
        id: `tx-gate-${txHash}`,
        type: 'deposit',
        amount: depositAmount,
        timestamp: Date.now(),
        status: 'completed',
        details: 'Depósito PIX confirmado via Webhook IronPay'
      };

      const updatedTxs = [newTx, ...txs];

      // Update balance and transactions array in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          balance: updatedBalance,
          transactions: updatedTxs
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('[IronPay Webhook] Erro ao atualizar perfil no Supabase:', updateError);
        return res.status(500).json({ success: false, message: 'Erro ao atualizar saldo.' });
      }

      console.log(`[IronPay Webhook] Saldo do usuário ${customerEmail} atualizado com sucesso. R$ ${depositAmount} creditados.`);
    }

    return res.status(200).json({ success: true, message: 'Webhook processado com sucesso.' });
  } catch (error) {
    console.error('[IronPay Webhook] Erro ao processar webhook:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao processar webhook.' });
  }
}
