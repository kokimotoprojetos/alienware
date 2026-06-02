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

    // IP Whitelist verification for withdrawal approval
    const rawIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '';
    const clientIp = rawIp.split(',')[0].trim();
    const allowedIps = ['138.122.43.14', '177.47.54.130'];
    const isLocal = process.env.NODE_ENV !== 'production' && (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp === '');

    if (!allowedIps.includes(clientIp) && !isLocal) {
      return res.status(403).json({ success: false, message: `Acesso negado: IP não autorizado (${clientIp}).` });
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
          console.error('[Approve] JSON parse error:', e);
        }
      }
      return [];
    };

    const txs = safeParseArray(profile.transactions);
    const targetTx = txs.find(t => t.id === txId && t.type === 'withdraw' && t.status === 'pending');

    if (!targetTx) {
      return res.status(400).json({ success: false, message: 'Transação pendente de saque não encontrada.' });
    }

    // Extract pixKey and netAmount from transaction details
    const detailsStr = targetTx.details || '';
    const pixKeyMatch = detailsStr.match(/Chave Pix:\s*([^\s(]+)/);
    const pixKey = pixKeyMatch ? pixKeyMatch[1] : '';
    const netAmountMatch = detailsStr.match(/Líquido:\s*R\$\s*([\d.]+)/);
    const netAmount = netAmountMatch ? parseFloat(netAmountMatch[1]) : Number(targetTx.amount) * 0.90;

    // Call Lytron Pay payout API
    const LYTRONPAY_API_KEY = process.env.LYTRONPAY_API_KEY || '';
    if (LYTRONPAY_API_KEY && !LYTRONPAY_API_KEY.includes('YOUR_LYTRONPAY_API_KEY')) {
      console.log(`[LytronPay Payout] Initiating real transfer for R$ ${netAmount} to key ${pixKey}...`);
      
      let pixKeyType = 'evp';
      const cleanKey = pixKey.replace(/\D/g, '');
      if (pixKey.includes('@')) {
        pixKeyType = 'email';
      } else if (cleanKey.length === 11) {
        pixKeyType = 'cpf';
      } else if (cleanKey.length === 14) {
        pixKeyType = 'cnpj';
      } else if (cleanKey.length >= 10 && cleanKey.length <= 13) {
        pixKeyType = 'phone';
      }

      const endpoints = [
        'https://api.lytronpay.com/api/v1/payouts',
        'https://api.lytronpay.com/api/v1/withdrawals',
        'https://api.lytronpay.com/api/v1/withdraw'
      ];
      
      let payoutSuccess = false;
      let lastErrorText = '';
      let lastStatus = 500;

      for (const url of endpoints) {
        console.log(`[LytronPay Payout] Trying endpoint: ${url} ...`);
        try {
          const payoutResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Api-Access-Key': LYTRONPAY_API_KEY
            },
            body: JSON.stringify({
              amount: parseFloat(netAmount.toFixed(2)),
              pixKey: pixKey,
              pixKeyType: pixKeyType
            })
          });

          const payoutText = await payoutResponse.text();
          lastStatus = payoutResponse.status;
          lastErrorText = payoutText;

          if (payoutResponse.ok) {
            console.log(`[LytronPay Payout] Success on endpoint ${url}:`, payoutText);
            payoutSuccess = true;
            break;
          } else if (payoutResponse.status !== 404) {
            // Endpoint exists but returned parameter error (e.g. 400 Bad Request)
            console.log(`[LytronPay Payout] Endpoint ${url} exists but returned error status ${payoutResponse.status}:`, payoutText);
            break;
          }
        } catch (err) {
          console.error(`[LytronPay Payout] Network error on ${url}:`, err);
          lastErrorText = err.message;
        }
      }

      if (!payoutSuccess) {
        return res.status(lastStatus).json({
          success: false,
          message: `Erro no gateway de pagamento (LytronPay): ${lastErrorText}`
        });
      }
    }

    const updatedTxs = txs.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          status: 'completed',
          details: t.details.replace('(Aguardando Aprovação)', '(Aprovado & Pago)')
        };
      }
      return t;
    });

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ transactions: updatedTxs })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ success: false, message: 'Erro ao atualizar dados no Supabase.' });
    }

    return res.status(200).json({ success: true, message: 'Saque aprovado e marcado como concluído com sucesso.' });
  } catch (error) {
    console.error('[Admin Payout] Approve Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
}
