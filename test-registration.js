import dotenv from 'dotenv';
import registerHandler from './api/auth-register.js';
import loginHandler from './api/auth-login.js';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Helper to mock Express response object
function makeMockResponse() {
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
  return res;
}

async function testAuthFlow() {
  console.log('--- STARTING AUTH FLOW TEST ---');
  
  const testEmail = `test_user_${Date.now()}@test.com`;
  const testPassword = 'testpassword123';

  // 1. Test Register
  console.log(`\n[Test 1] Registering user with email: ${testEmail}`);
  const reqRegister = {
    method: 'POST',
    body: {
      phoneOrEmail: testEmail,
      password: testPassword
    }
  };
  const resRegister = makeMockResponse();
  await registerHandler(reqRegister, resRegister);

  console.log('Register Response Status:', resRegister.statusCode);
  console.log('Register Response Data:', JSON.stringify(resRegister.data, null, 2));

  if (resRegister.statusCode !== 201 || !resRegister.data.success) {
    console.error('❌ Register failed!');
    process.exit(1);
  }
  console.log('✅ Register test passed successfully!');

  // 2. Test Login
  console.log(`\n[Test 2] Logging in user with email: ${testEmail}`);
  const reqLogin = {
    method: 'POST',
    body: {
      phoneOrEmail: testEmail,
      password: testPassword
    }
  };
  const resLogin = makeMockResponse();
  await loginHandler(reqLogin, resLogin);

  console.log('Login Response Status:', resLogin.statusCode);
  console.log('Login Response Data:', JSON.stringify(resLogin.data, null, 2));

  if (resLogin.statusCode !== 200 || !resLogin.data.success) {
    console.error('❌ Login failed!');
    process.exit(1);
  }
  console.log('✅ Login test passed successfully!');

  // 3. Query Database directly to verify plain-text password
  console.log('\n[Test 3] Querying DB directly to check password format...');
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: userProfile, error } = await supabase
    .from('profiles')
    .select('password')
    .eq('phone_or_email', testEmail)
    .single();

  if (error || !userProfile) {
    console.error('❌ Failed to fetch user from DB:', error);
    process.exit(1);
  }

  const savedPassword = userProfile.password;
  console.log('Password fetched from DB:', savedPassword);
  if (savedPassword === testPassword) {
    console.log('✅ Plain-text password verification passed! Password is stored exactly as entered.');
  } else {
    console.error('❌ Password mismatch or was hashed. Expected:', testPassword, 'Got:', savedPassword);
    process.exit(1);
  }

  console.log('\n✅ ALL AUTH TESTS PASSED SUCCESSFULLY!');
}

testAuthFlow().catch(err => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
