export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    console.log('[IronPay Webhook] Recebido postback do gateway:', JSON.stringify(payload, null, 2));

    // You can add database updates here in the future if you migrate from localStorage to a backend database

    return res.status(200).json({ success: true, message: 'Webhook recebido com sucesso.' });
  } catch (error) {
    console.error('[IronPay Webhook] Erro ao processar webhook:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao processar webhook.' });
  }
}
