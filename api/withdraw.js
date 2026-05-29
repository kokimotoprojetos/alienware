export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { amount, pixKey } = req.body;
    if (!amount || isNaN(amount) || amount <= 0 || !pixKey) {
      return res.status(400).json({ success: false, message: 'Parâmetros de saque inválidos.' });
    }

    const IRONPAY_API_TOKEN = process.env.IRONPAY_API_TOKEN || '';
    const isMockMode = !IRONPAY_API_TOKEN || IRONPAY_API_TOKEN.includes('YOUR_IRONPAY_API_TOKEN');
    const amountInCentavos = Math.round(amount * 100);

    if (isMockMode) {
      return res.status(200).json({
        success: true,
        mock: true,
        message: `Saque de R$ ${amount.toFixed(2)} processado com imediato sucesso na rede de transação!`
      });
    }

    // 1. Register bank account / PIX key
    const bankResponse = await fetch('https://api.ironpayapp.com.br/api/public/v1/bank-accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_token: IRONPAY_API_TOKEN,
        bank_name: 'Saque Pix Alienware',
        account_type: 'checking',
        account_number: '99999',
        branch_number: '0001',
        document_number: '12345678900',
        pix_key: pixKey
      })
    });

    const bankData = await bankResponse.json();
    if (!bankResponse.ok) {
      return res.status(bankResponse.status).json({ 
        success: false, 
        message: 'Erro ao registrar chave de saque no gateway.', 
        error: bankData 
      });
    }

    const bankAccountId = bankData.id;

    // 2. Perform payout / withdrawal
    const payoutResponse = await fetch('https://api.ironpayapp.com.br/api/public/v1/withdrawals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_token: IRONPAY_API_TOKEN,
        amount: amountInCentavos,
        bank_account_id: bankAccountId,
        description: `Saque Alienware Capital - Chave ${pixKey}`
      })
    });

    const payoutData = await payoutResponse.json();
    if (!payoutResponse.ok) {
      return res.status(payoutResponse.status).json({ 
        success: false, 
        message: 'Falha na execução do saque na IronPay.', 
        error: payoutData 
      });
    }

    return res.status(200).json({
      success: true,
      message: `Saque de R$ ${amount.toFixed(2)} processado com imediato sucesso na rede de transação!`,
      payout: payoutData
    });

  } catch (error) {
    console.error('[Vercel Serverless] Payout Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no processamento do saque.' });
  }
}
