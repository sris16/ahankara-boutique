import { ShiprocketShippingProvider } from '../src/server/services/shipping/providers/shiprocket.provider';

async function testShiprocketAuthentication() {
  console.log('=============== SHIPROCKET STEP 2 — REAL LIVE AUTHENTICATION ===============\n');

  const provider = new ShiprocketShippingProvider();

  console.log('Provider Type:', provider.providerType);
  console.log('Initial In-Memory Token State:', provider.hasMemoryToken() ? 'PRESENT' : 'NONE');

  console.log('\nExecuting REAL Shiprocket HTTPS Authentication request...');

  const token = await provider.authenticate();

  console.log('\nAuthentication Results:');
  console.log('- HTTPS Connection: SUCCESS');
  console.log('- Credentials Accepted: TRUE');
  console.log('- JWT Token Received: TRUE');
  console.log('- Token Type Check (starts with "eyJ"):', token.startsWith('eyJ'));
  console.log('- Token Length:', token.length, 'characters');
  console.log('- Runtime Memory Token Storage Verified:', provider.hasMemoryToken());

  if (!token || !token.startsWith('eyJ') || !provider.hasMemoryToken()) {
    console.error('❌ Shiprocket Authentication Verification FAILED');
    process.exit(1);
  }

  console.log('\n=============== AUTHENTICATION TEST COMPLETED SUCCESSFULLY ===============\n');
}

testShiprocketAuthentication().catch(err => {
  console.error('❌ Shiprocket Authentication Error:', err);
  process.exit(1);
});
