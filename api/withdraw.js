import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function verifySessionToken(token, userId, secret) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [tokenUserId, timestamp, providedHmac] = parts;

    // Token must belong to the requesting user
    if (tokenUserId !== userId) return false;

    // Token must not be older than 24 hours
    const tokenAge = Date.now() - Number(timestamp);
    if (tokenAge > 86_400_000) return false;

    // Verify HMAC signature
    const payload = `${tokenUserId}:${timestamp}`;
    const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // --- Authenticate the request ---
    const sessionToken = req.headers['x-session-token'] || '';
    const sessionSecret = process.env.SESSION_SECRET;

    if (!sessionSecret) {
      return res.status(500).json({ success: false, message: 'Configuração de sessão ausente no servidor.' });
    }

    const { amount, pixKey, userId } = req.body;

    if (!amount || isNaN(amount) || amount <= 0 || !pixKey || !userId) {
      return res.status(400).json({ success: false, message: 'Parâmetros de saque inválidos.' });
    }

    if (!sessionToken || !verifySessionToken(sessionToken, userId, sessionSecret)) {
      return res.status(401).json({ success: false, message: 'Sessão inválida ou expirada. Faça login novamente.' });
    }

    // --- Database operations ---
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseSecretKey) {
      return res.status(500).json({ success: false, message: 'Configuração do banco de dados ausente no servidor.' });
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // 1. Fetch user profile to verify balance server-side
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError || !profile) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    // 2. Server-side balance check (source of truth — not the frontend)
    const currentBalance = Number(profile.balance);
    if (currentBalance < amount) {
      return res.status(400).json({ success: false, message: 'Saldo insuficiente para saque.' });
    }

    // 3. Minimum withdrawal enforcement
    if (amount < 30) {
      return res.status(400).json({ success: false, message: 'O valor mínimo para saque é de R$ 30,00.' });
    }

    const numAmount = Number(amount);
    const fee = numAmount * 0.10;
    const netAmount = numAmount - fee;

    // 4. Deduct balance and create PENDING transaction
    const updatedBalance = currentBalance - numAmount;

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
      amount: numAmount,
      timestamp: Date.now(),
      status: 'pending',
      details: `Saque solicitado para Chave Pix: ${pixKey} (Líquido: R$ ${netAmount.toFixed(2)}, Taxa 10%: R$ ${fee.toFixed(2)})`
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
      message: 'Solicitação de saque de R$ ' + numAmount.toFixed(2) + ' (Líquido: R$ ' + netAmount.toFixed(2) + ' após taxa de 10%) enviada para análise do administrador com sucesso!'
    });

  } catch (error) {
    console.error('[Vercel Serverless] Payout Request Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no processamento do saque.' });
  }
}
