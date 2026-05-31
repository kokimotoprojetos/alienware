import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Acesso negado: Token de autorização ausente.' });
    }

    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminUser || !adminPass) {
      return res.status(500).json({ success: false, message: 'Configuração de admin ausente no servidor.' });
    }
    const expectedToken = Buffer.from(`${adminUser}:${adminPass}`).toString('base64');

    if (authHeader !== `Bearer ${expectedToken}`) {
      return res.status(403).json({ success: false, message: 'Acesso negado: Token inválido ou expirado.' });
    }

    const { userId, balance } = req.body;
    if (!userId || isNaN(balance) || balance < 0) {
      return res.status(400).json({ success: false, message: 'Parâmetros inválidos.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseSecretKey) {
      return res.status(500).json({ success: false, message: 'Supabase credentials missing on server.' });
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    const { error } = await supabase
      .from('profiles')
      .update({ balance: parseFloat(balance) })
      .eq('id', userId);

    if (error) {
      console.error('[Admin API] Database error updating balance:', error);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar saldo no banco.', error });
    }

    return res.status(200).json({ success: true, message: 'Saldo atualizado com sucesso.' });
  } catch (error) {
    console.error('[Admin API] Update Balance Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
}
