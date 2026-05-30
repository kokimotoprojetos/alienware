import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Acesso negado: Token de autorização ausente.' });
    }

    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'alienwareadmin2026';
    const expectedToken = Buffer.from(`${adminUser}:${adminPass}`).toString('base64');

    if (authHeader !== `Bearer ${expectedToken}`) {
      return res.status(403).json({ success: false, message: 'Acesso negado: Token inválido ou expirado.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseSecretKey) {
      return res.status(500).json({ success: false, message: 'Supabase credentials missing on server.' });
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin API] Database error fetching profiles:', error);
      return res.status(500).json({ success: false, message: 'Erro ao buscar dados no banco de dados.', error });
    }

    return res.status(200).json({ success: true, profiles: data || [] });
  } catch (error) {
    console.error('[Admin API] Profiles Fetch Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
}
