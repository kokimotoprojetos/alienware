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

    const IRONPAY_API_TOKEN = process.env.IRONPAY_API_TOKEN || '';
    const IRONPAY_OFFER_HASH = process.env.IRONPAY_OFFER_HASH || '';
    const isMockMode = !IRONPAY_API_TOKEN || IRONPAY_API_TOKEN.includes('YOUR_IRONPAY_API_TOKEN');
    
    const amountInCentavos = Math.round(amount * 100);

    if (isMockMode) {
      const txId = `iron_tx_${Date.now()}`;
      const pixPayload = `00020126580014br.gov.bcb.pix0136932e605d-6f77-4c4c-9f88-8255476a66b55204000053039865405${amount.toFixed(2)}5802BR5925ALIENWARE_INVEST_GATEWAY`;
      
      const mockTx = {
        id: txId,
        amount: amountInCentavos,
        payment_method: 'pix',
        pix_code: pixPayload,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        mock: true,
        transaction: mockTx
      });
    }

    // Verify if offer hash is configured in production
    if (!IRONPAY_OFFER_HASH) {
      return res.status(400).json({ 
        success: false, 
        message: 'Configuração ausente: A variável de ambiente IRONPAY_OFFER_HASH não foi configurada no servidor Vercel. Crie uma oferta no painel da IronPay e insira seu hash.'
      });
    }

    // Construct checkout body following IronPay requirement
    const requestBody = {
      api_token: IRONPAY_API_TOKEN,
      offer_hash: IRONPAY_OFFER_HASH,
      payment_method: 'pix',
      amount: amountInCentavos, // Added amount at root
      customer: {
        name: name,
        email: email,
        document: cpf ? cpf.replace(/\D/g, '') : '12345678909' // Fallback document if empty
      },
      cart: {
        items: {
          id: "1",
          name: "Adicionar Saldo Alienware Capital",
          price: amountInCentavos,
          quantity: 1
        },
        total: {
          price: amountInCentavos,
          quantity: 1
        }
      }
    };

    console.log('[IronPay Backend] Enviando cobrança para a IronPay...', requestBody);

    const response = await fetch('https://api.ironpayapp.com.br/api/public/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[IronPay Backend] Failed to parse JSON response:', responseText);
      return res.status(500).json({ 
        success: false, 
        message: `Resposta inválida do gateway (não é JSON). Status: ${response.status}`,
        details: responseText
      });
    }

    if (!response.ok) {
      console.error('[IronPay Backend] Resposta de erro do gateway:', data);
      return res.status(response.status).json({ success: false, error: data });
    }

    // Return the response containing the pix_code
    return res.status(200).json({
      success: true,
      transaction: data
    });

  } catch (error) {
    console.error('[Vercel Serverless] Deposit Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Erro interno no servidor: ${error.message}`,
      stack: error.stack
    });
  }
}
