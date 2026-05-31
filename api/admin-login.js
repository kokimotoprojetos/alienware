export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminUser || !adminPass) {
      return res.status(500).json({ success: false, message: 'Configuração de admin ausente no servidor.' });
    }

    if (username === adminUser && password === adminPass) {
      // Generate a simple token that expires or matches a server-side check
      // For simplicity and security, we can use a token based on the admin password
      const sessionToken = Buffer.from(`${adminUser}:${adminPass}`).toString('base64');
      
      return res.status(200).json({ 
        success: true, 
        token: sessionToken,
        message: 'Autenticação administrativa bem sucedida.' 
      });
    }

    return res.status(401).json({ success: false, message: 'Usuário ou senha administrativa inválidos.' });
  } catch (error) {
    console.error('[Admin API] Login Error:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
}
