/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const IRONPAY_API_TOKEN = process.env.IRONPAY_API_TOKEN || '';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// In-memory simulator for when IRONPAY_API_TOKEN is a placeholder or missing
const localTransactions = new Map();

// Helper to determine if we should run in mock mode
const isMockMode = !IRONPAY_API_TOKEN || IRONPAY_API_TOKEN.includes('YOUR_IRONPAY_API_TOKEN');

console.log(`[IronPay Backend] Starting server...`);
console.log(`[IronPay Backend] Mode: ${isMockMode ? 'MOCK / SIMULATOR GATEWAY' : 'REAL IRONPAY GATEWAY'}`);

/**
 * Endpoint: POST /api/deposit
 * Generates a PIX payment request (transaction)
 */
app.post('/api/deposit', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valor inválido.' });
    }

    const amountInCentavos = Math.round(amount * 100);

    if (isMockMode) {
      // Simulate real gateway response structure
      const txId = `iron_tx_${Date.now()}`;
      const pixPayload = `00020126580014br.gov.bcb.pix0136932e605d-6f77-4c4c-9f88-8255476a66b55204000053039865405${amount.toFixed(2)}5802BR5925ALIENWARE_INVEST_GATEWAY`;
      
      const mockTx = {
        id: txId,
        amount: amountInCentavos,
        payment_method: 'pix',
        pix_code: pixPayload,
        qr_code_url: 'https://docs.ironpayapp.com.br/assets/index-CZ6gGEP2.js', // placeholder
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      localTransactions.set(txId, mockTx);

      // Auto-approve after 8 seconds of simulation for testing purposes
      setTimeout(() => {
        const tx = localTransactions.get(txId);
        if (tx && tx.status === 'pending') {
          tx.status = 'paid';
          localTransactions.set(txId, tx);
          console.log(`[Gateway Mock] Transação ${txId} auto-aprovada.`);
        }
      }, 8000);

      return res.json({
        success: true,
        mock: true,
        transaction: mockTx
      });
    }

    // Call real IronPay API
    console.log(`[IronPay Backend] Creating real transaction for R$ ${amount}...`);
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
      console.error('[IronPay Backend] API Error:', data);
      return res.status(response.status).json({ success: false, error: data });
    }

    return res.json({
      success: true,
      transaction: data
    });

  } catch (error) {
    console.error('[IronPay Backend] Internal Error generating deposit:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao gerar o PIX.' });
  }
});

/**
 * Endpoint: GET /api/deposit/status/:txId
 * Checks status of a PIX deposit transaction
 */
app.get('/api/deposit/status/:txId', async (req, res) => {
  try {
    const { txId } = req.params;

    if (isMockMode) {
      const tx = localTransactions.get(txId);
      if (!tx) {
        return res.status(404).json({ success: false, message: 'Transação não encontrada.' });
      }
      return res.json({ success: true, status: tx.status });
    }

    // Query real IronPay API
    const response = await fetch(`https://api.ironpayapp.com.br/api/public/v1/transactions/${txId}?api_token=${IRONPAY_API_TOKEN}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data });
    }

    // Return status mapping
    // Assuming status can be "paid", "pending", "failed"
    return res.json({
      success: true,
      status: data.status
    });

  } catch (error) {
    console.error('[IronPay Backend] Error checking status:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao consultar status.' });
  }
});

/**
 * Endpoint: POST /api/withdraw
 * Performs withdrawal: registers bank account/Pix key first, then requests payout
 */
app.post('/api/withdraw', async (req, res) => {
  try {
    const { amount, pixKey, pixKeyType } = req.body;
    if (!amount || isNaN(amount) || amount <= 0 || !pixKey) {
      return res.status(400).json({ success: false, message: 'Parâmetros de saque inválidos.' });
    }

    const amountInCentavos = Math.round(amount * 100);

    if (isMockMode) {
      console.log(`[Gateway Mock] Processando saque simulado de R$ ${amount} para chave ${pixKey}...`);
      return res.json({
        success: true,
        mock: true,
        message: `Saque de R$ ${amount.toFixed(2)} processado com imediato sucesso na rede de transação!`
      });
    }

    // 1. Register bank account / PIX key
    console.log(`[IronPay Backend] Registrando conta/chave PIX para saque...`);
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
        document_number: '12345678900', // standard document
        pix_key: pixKey
      })
    });

    const bankData = await bankResponse.json();
    if (!bankResponse.ok) {
      console.error('[IronPay Backend] Bank Account Registration Error:', bankData);
      return res.status(bankResponse.status).json({ 
        success: false, 
        message: 'Erro ao registrar chave de saque no gateway.', 
        error: bankData 
      });
    }

    const bankAccountId = bankData.id;

    // 2. Perform payout / withdrawal
    console.log(`[IronPay Backend] Solicitando saque para conta ID ${bankAccountId}...`);
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
      console.error('[IronPay Backend] Payout Request Error:', payoutData);
      return res.status(payoutResponse.status).json({ 
        success: false, 
        message: 'Falha na execução do saque na IronPay.', 
        error: payoutData 
      });
    }

    return res.json({
      success: true,
      message: `Saque de R$ ${amount.toFixed(2)} processado com imediato sucesso na rede de transação!`,
      payout: payoutData
    });

  } catch (error) {
    console.error('[IronPay Backend] Payout execution error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no processamento do saque.' });
  }
});

// Serve frontend build in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[IronPay Backend] Server running on port ${PORT}`);
});
