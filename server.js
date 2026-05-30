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
const LYTRONPAY_API_KEY = process.env.LYTRONPAY_API_KEY || '';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// In-memory simulator for when LYTRONPAY_API_KEY is a placeholder or missing
const localTransactions = new Map();

// Helper to determine if we should run in mock mode
const isMockMode = !LYTRONPAY_API_KEY || LYTRONPAY_API_KEY.includes('YOUR_LYTRONPAY_API_KEY');

console.log(`[LytronPay Backend] Starting server...`);
console.log(`[LytronPay Backend] Mode: ${isMockMode ? 'MOCK / SIMULATOR GATEWAY' : 'REAL LYTRON PAY GATEWAY'}`);

/**
 * Endpoint: POST /api/deposit
 * Generates a PIX payment request (transaction)
 */
app.post('/api/deposit', async (req, res) => {
  try {
    const { amount, email, name, cpf } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valor inválido.' });
    }

    if (isMockMode) {
      // Simulate real gateway response structure
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

    // Call real Lytron Pay API
    console.log(`[LytronPay Backend] Creating real transaction for R$ ${amount}...`);
    const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '12345678909';
    
    const response = await fetch('https://api.lytronpay.com/api/v1/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Access-Key': LYTRONPAY_API_KEY
      },
      body: JSON.stringify({
        amount: Number(amount),
        description: `Recarga Alienware - ${email || 'Client'}`,
        customer: {
          name: name || 'Investidor Alienware',
          email: email || 'investidor@alienware.space',
          document: {
            type: 'cpf',
            number: cleanCpf.length === 11 ? cleanCpf : '12345678909'
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[LytronPay Backend] API Error:', data);
      return res.status(response.status).json({ success: false, error: data });
    }

    return res.json({
      success: true,
      transaction: {
        id: data.txid,
        pix_code: data.copyPaste,
        status: data.status
      }
    });

  } catch (error) {
    console.error('[LytronPay Backend] Internal Error generating deposit:', error);
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

    if (isMockMode || txId.startsWith('mock_tx_')) {
      const tx = localTransactions.get(txId);
      if (!tx) {
        return res.status(404).json({ success: false, message: 'Transação não encontrada.' });
      }
      return res.json({ success: true, status: tx.status });
    }

    // Query real Lytron Pay API
    const response = await fetch(`https://api.lytronpay.com/api/v1/charges/${txId}`, {
      headers: {
        'Api-Access-Key': LYTRONPAY_API_KEY
      }
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data });
    }

    return res.json({
      success: true,
      status: data.status
    });

  } catch (error) {
    console.error('[LytronPay Backend] Error checking status:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao consultar status.' });
  }
});

// Serve frontend build in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[LytronPay Backend] Server running on port ${PORT}`);
});
