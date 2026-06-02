import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function checkPending() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error fetching profiles:', error);
    process.exit(1);
  }

  console.log('Total profiles fetched:', profiles.length);

  let pendingCount = 0;
  profiles.forEach(p => {
    let txs = [];
    try {
      txs = typeof p.transactions === 'string' ? JSON.parse(p.transactions) : p.transactions;
      if (!Array.isArray(txs)) txs = [];
    } catch (e) {
      return;
    }

    txs.forEach(tx => {
      if (tx.type === 'withdraw' && tx.status === 'pending') {
        pendingCount++;
        console.log(`\nUser: ${p.phone_or_email} (ID: ${p.id})`);
        console.log(`Tx ID: ${tx.id}`);
        console.log(`Amount: R$ ${tx.amount}`);
        console.log(`Details: ${tx.details}`);
        console.log(`Timestamp: ${new Date(tx.timestamp).toLocaleString('pt-BR')}`);
      }
    });
  });

  console.log(`\nTotal pending withdrawals in DB: ${pendingCount}`);
}

checkPending().catch(console.error);
