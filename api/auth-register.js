import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

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
    if (!phoneOrEmail || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Credenciais inválidas. A senha deve ter no mínimo 6 caracteres.' });
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

    // Check if user already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_or_email', phoneOrEmail)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, message: 'Usuário já cadastrado com este e-mail/telefone.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert new user
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        phone_or_email: phoneOrEmail,
        password: hashedPassword,
        balance: 0.00,
        user_rigs: [],
        transactions: [],
        referrals: [],
        completed_missions: [],
        checkin_claimed_today: false,
        last_checkin_date: null
      }])
      .select()
      .single();

    if (error || !data) {
      console.error('[Auth Register] Insert error:', error);
      return res.status(500).json({ success: false, message: 'Erro ao criar conta. Tente novamente.' });
    }

    const sessionToken = generateSessionToken(data.id, sessionSecret);

    return res.status(201).json({
      success: true,
      user: { id: data.id, phone_or_email: data.phone_or_email },
      sessionToken
    });

  } catch (error) {
    console.error('[Auth Register] Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
}
