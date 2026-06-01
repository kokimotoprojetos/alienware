import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

function generateSessionToken(userId, secret) {
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { phoneOrEmail, password } = req.body;
    if (!phoneOrEmail || !password) {
      return res.status(400).json({ success: false, message: 'Credenciais obrigatórias.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const sessionSecret = process.env.SESSION_SECRET;

    if (!supabaseUrl || !supabaseSecretKey) {
      return res.status(500).json({ success: false, message: 'Configuração de banco de dados ausente no servidor.' });
    }
    if (!sessionSecret) {
      return res.status(500).json({ success: false, message: 'Configuração de sessão ausente no servidor.' });
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone_or_email', phoneOrEmail)
      .maybeSingle();

    if (error || !profile) {
      // Deliberate generic message to avoid user enumeration
      return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    }

    // Compare password: supports both bcrypt hashes and plain text
    let passwordValid = false;
    const isHashed = profile.password && profile.password.startsWith('$2');

    if (isHashed) {
      passwordValid = await bcrypt.compare(password, profile.password);
    } else {
      passwordValid = profile.password === password;
    }

    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    }

    const sessionToken = generateSessionToken(profile.id, sessionSecret);

    return res.status(200).json({
      success: true,
      user: {
        id: profile.id,
        phone_or_email: profile.phone_or_email
      },
      profile: {
        balance: Number(profile.balance),
        user_rigs: profile.user_rigs,
        transactions: profile.transactions,
        referrals: profile.referrals,
        completed_missions: profile.completed_missions,
        checkin_claimed_today: profile.checkin_claimed_today
      },
      sessionToken
    });

  } catch (error) {
    console.error('[Auth Login] Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
}
