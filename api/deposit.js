export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valor inválido.' });
    }

    const IRONPAY_API_TOKEN = process.env.IRONPAY_API_TOKEN || '';
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

    const response = await fetch('https://api.ironpayapp.com.br/api/public/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_token: IRONPAY_API_TOKEN,
        amount: amountInCentavos,
        payment_method: 'pix'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data });
    }

    return res.status(200).json({
      success: true,
      transaction: data
    });

  } catch (error) {
    console.error('[Vercel Serverless] Deposit Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao gerar o PIX.' });
  }
}
