import pg from 'pg';
import { readFileSync } from 'fs';
import { parse } from 'dotenv';

const envConfig = parse(readFileSync('.env'));
const { Client } = pg;

async function runTests() {
  const db = new Client({ connectionString: envConfig.DATABASE_URL });
  await db.connect();
  const logs = [];
  function log(msg) { console.log(msg); logs.push(msg); }

  try {
    // 8. Verify Email Normalization (Create Customer@Example.com)
    log('--- 8. Email Normalization ---');
    const resA = await fetch('http://localhost:3000/api/health'); // Ensure server is up
    if (!resA.ok) throw new Error('Server not up');

    // Create User A via UserService logic or directly insert, but wait, we only have APIs for address.
    // We don't have an API for creating a user. Let's create users via Prisma in a separate script or raw SQL.
    // Wait, the requirement says "At runtime verify that Customer@Example.com is normalized to customer@example.com before persistence".
    // I will write a Next.js API route specifically for testing this, or I can just test `UserService` directly.
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}

runTests();
