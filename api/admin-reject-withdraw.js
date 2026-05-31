import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Acesso negado: Token ausente.' });
    }

    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminUser || !adminPass) {
      return res.status(500).json({ success: false, message: 'Configuração de admin ausente no servidor.' });
    }
    const expectedToken = Buffer.from(`${adminUser}:${adminPass}`).toString('base64');

    if (authHeader !== `Bearer ${expectedToken}`) {
      return res.status(403).json({ success: false, message: 'Acesso negado: Token inválido.' });
    }

    const { userId, txId } = req.body;
    if (!userId || !txId) {
      return res.status(400).json({ success: false, message: 'ID do usuário e ID da transação são obrigatórios.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseSecretKey) {
      return res.status(500).json({ success: false, message: 'Supabase credentials missing on server.' });
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Fetch user profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError || !profile) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    const safeParseArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          console.error('[Reject] JSON parse error:', e);
        }
      }
      return [];
    };

    const txs = safeParseArray(profile.transactions);
    let refundAmount = 0;
    let txFound = false;

    const updatedTxs = txs.map(t => {
      if (t.id === txId && t.type === 'withdraw' && t.status === 'pending') {
        txFound = true;
        refundAmount = Number(t.amount);
        return {
          ...t,
          status: 'failed',
          details: t.details.replace('(Aguardando Aprovação)', '(Rejeitado e Reembolsado)')
        };
      }
      return t;
    });

    if (!txFound) {
      return res.status(400).json({ success: false, message: 'Transação pendente de saque não encontrada.' });
    }

    // Refund balance
    const updatedBalance = Number(profile.balance) + refundAmount;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        balance: updatedBalance,
        transactions: updatedTxs
      })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ success: false, message: 'Erro ao atualizar saldo no Supabase.' });
    }

    return res.status(200).json({ success: true, message: 'Saque recusado e saldo reembolsado com sucesso.' });
  } catch (error) {
    console.error('[Admin Payout] Reject Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
}
