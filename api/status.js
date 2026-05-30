export default async function handler(req, res) {
  try {
    const { txId } = req.query;
    if (!txId) {
      return res.status(400).json({ success: false, message: 'ID da transação não fornecido.' });
    }

    const LYTRONPAY_API_KEY = process.env.LYTRONPAY_API_KEY || '';
    const isMockMode = !LYTRONPAY_API_KEY || LYTRONPAY_API_KEY.includes('YOUR_LYTRONPAY_API_KEY');

    if (isMockMode || txId.startsWith('mock_tx_') || txId.startsWith('iron_tx_')) {
      // Mock mode status verification
      const timestamp = parseInt(txId.replace(/^(mock_tx_|iron_tx_)/, ''), 10);
      const elapsed = Date.now() - (isNaN(timestamp) ? Date.now() : timestamp);
      const status = elapsed > 8000 ? 'paid' : 'pending';
      return res.status(200).json({ success: true, status });
    }

    const response = await fetch(`https://api.lytronpay.com/api/v1/charges/${txId}`, {
      headers: {
        'Api-Access-Key': LYTRONPAY_API_KEY
      }
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data });
    }

    // Map paid or completed status to paid
    const statusMap = {
      'paid': 'paid',
      'completed': 'paid',
      'approved': 'paid',
      'pending': 'pending',
      'charge.paid': 'paid'
    };

    return res.status(200).json({
      success: true,
      status: statusMap[data.status] || data.status
    });

  } catch (error) {
    console.error('[Vercel Serverless] Status Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao consultar status.' });
  }
}
