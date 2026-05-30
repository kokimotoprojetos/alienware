import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { amount, name, email, cpf } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valor de recarga inválido.' });
    }
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome e E-mail são obrigatórios para emissão do PIX junto ao gateway.' 
      });
    }

    const LYTRONPAY_API_KEY = process.env.LYTRONPAY_API_KEY || '';
    const isMockMode = !LYTRONPAY_API_KEY || LYTRONPAY_API_KEY.includes('YOUR_LYTRONPAY_API_KEY');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    
    let supabase = null;
    if (supabaseUrl && supabaseSecretKey) {
      supabase = createClient(supabaseUrl, supabaseSecretKey);
    }

    if (isMockMode) {
      const txId = `mock_tx_${Date.now()}`;
      const pixPayload = `00020126580014br.gov.bcb.pix0136932e605d-6f77-4c4c-9f88-8255476a66b55204000053039865405${Number(amount).toFixed(2)}5802BR5925ALIENWARE_INVEST_GATEWAY`;
      
      const mockTx = {
        id: txId,
        amount: Number(amount),
        payment_method: 'pix',
        pix_code: pixPayload,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Write pending transaction to Supabase if available
      if (supabase) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone_or_email', email)
          .maybeSingle();

        if (profile) {
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

          const txs = safeParseArray(profile.transactions);
          const newTx = {
            id: `tx-gate-${txId}`,
            type: 'deposit',
            amount: Number(amount),
            timestamp: Date.now(),
            status: 'pending',
            details: 'Depósito PIX Simulado (Aguardando Pagamento)'
          };

          await supabase
            .from('profiles')
            .update({ transactions: [newTx, ...txs] })
            .eq('id', profile.id);
        }
      }
      
      return res.status(200).json({
        success: true,
        mock: true,
        transaction: mockTx
      });
    }

    const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '12345678909';
    const cleanCpfValidated = cleanCpf.length === 11 ? cleanCpf : '12345678909';

    // Construct body for Lytron Pay Charge
    const requestBody = {
      amount: Number(amount),
      description: `Recarga Alienware - ${email}`,
      customer: {
        name: name,
        email: email,
        document: {
          type: 'cpf',
          number: cleanCpfValidated
        }
      }
    };

    console.log('[LytronPay Backend] Enviando cobrança para LytronPay...', requestBody);

    const response = await fetch('https://api.lytronpay.com/api/v1/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Access-Key': LYTRONPAY_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[LytronPay Backend] Failed to parse JSON response:', responseText);
      return res.status(500).json({ 
        success: false, 
        message: `Resposta inválida do gateway (não é JSON). Status: ${response.status}.`
      });
    }

    if (!response.ok) {
      console.error('[LytronPay Backend] Resposta de erro do gateway:', data);
      return res.status(response.status).json({ success: false, error: data });
    }

    // Write pending transaction to Supabase database so the webhook can resolve it by txid
    if (supabase) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_or_email', email)
        .maybeSingle();

      if (profile) {
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

        const txs = safeParseArray(profile.transactions);
        const newTx = {
          id: `tx-gate-${data.txid}`,
          type: 'deposit',
          amount: Number(amount),
          timestamp: Date.now(),
          status: 'pending',
          details: 'Aguardando pagamento do PIX LytronPay'
        };

        await supabase
          .from('profiles')
          .update({ transactions: [newTx, ...txs] })
          .eq('id', profile.id);
      }
    }

    // Return the response structured for frontend compatibility
    return res.status(200).json({
      success: true,
      transaction: {
        id: data.txid,
        pix_code: data.copyPaste,
        status: data.status
      }
    });

  } catch (error) {
    console.error('[Vercel Serverless] Deposit Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Erro interno no servidor: ${error.message}`
    });
  }
}
