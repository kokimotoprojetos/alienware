export default async function handler(req, res) {
  try {
    const { txId } = req.query;
    if (!txId) {
      return res.status(400).json({ success: false, message: 'ID da transação não fornecido.' });
    }

    const IRONPAY_API_TOKEN = process.env.IRONPAY_API_TOKEN || '';
    const isMockMode = !IRONPAY_API_TOKEN || IRONPAY_API_TOKEN.includes('YOUR_IRONPAY_API_TOKEN');

    if (isMockMode || txId.startsWith('iron_tx_')) {
      // Stateless mock polling: auto-approve after 8 seconds of creation
      const timestamp = parseInt(txId.replace('iron_tx_', ''), 10);
      const elapsed = Date.now() - (isNaN(timestamp) ? Date.now() : timestamp);
      const status = elapsed > 8000 ? 'paid' : 'pending';
      return res.status(200).json({ success: true, status });
    }

    const response = await fetch(`https://api.ironpayapp.com.br/api/public/v1/transactions/${txId}?api_token=${IRONPAY_API_TOKEN}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data });
    }

    return res.status(200).json({
      success: true,
      status: data.status
    });

  } catch (error) {
    console.error('[Vercel Serverless] Status Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao consultar status.' });
  }
}
