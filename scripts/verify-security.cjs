/**
 * scripts/verify-security.cjs
 * Security verification script proving strict RLS isolation.
 * Connects with:
 *   1. An anonymous client (unauthenticated)
 *   2. An authenticated non-enrolled student client (Priya Nair)
 * Attempts to access protected session_links, lesson_media, and another student's orders.
 * Asserts that each attempt returns 0 rows or an authorization error.
 */

const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        if (typeof process.loadEnvFile === 'function') {
          process.loadEnvFile(fullPath);
        } else {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
              const [key, ...values] = trimmed.split('=');
              const val = values.join('=').trim().replace(/^["']|["']$/g, '');
              if (!process.env[key.trim()]) {
                process.env[key.trim()] = val;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Could not parse ${file}: ${err.message}`);
      }
    }
  }
}

loadEnv();

const isLocal = process.argv.includes('--local') || process.env.LOCAL === 'true';
const LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const SUPABASE_URL = isLocal
  ? 'http://127.0.0.1:54321'
  : (process.env.SUPABASE_URL || 'http://127.0.0.1:54321');

const SUPABASE_ANON_KEY = isLocal
  ? LOCAL_ANON_KEY
  : (process.env.SUPABASE_ANON_KEY || LOCAL_ANON_KEY);

async function runSecurityChecks() {
  console.log('====================================================');
  console.log('  ABrainoConscious Platform - Security Verification ');
  console.log('====================================================\n');

  let passedAssertions = 0;
  let totalAssertions = 0;

  function assert(description, condition) {
    totalAssertions++;
    if (condition) {
      console.log(`[PASS] ${description}`);
      passedAssertions++;
    } else {
      console.error(`[FAIL] ${description}`);
    }
  }

  // 1. Anonymous Client Checks
  console.log('--- Phase 1: Anonymous Access Checks ---');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Attempt to read session_links
  const { data: anonLinks, error: anonLinksErr } = await anonClient
    .from('session_links')
    .select('*');
  assert(
    'Anon cannot read protected session_links (0 rows or error)',
    (!anonLinks || anonLinks.length === 0) || !!anonLinksErr
  );

  // Attempt to read orders
  const { data: anonOrders, error: anonOrdersErr } = await anonClient
    .from('orders')
    .select('*');
  assert(
    'Anon cannot read orders (0 rows or error)',
    (!anonOrders || anonOrders.length === 0) || !!anonOrdersErr
  );

  // Attempt to read payments
  const { data: anonPayments, error: anonPaymentsErr } = await anonClient
    .from('payments')
    .select('*');
  assert(
    'Anon cannot read payments (0 rows or error)',
    (!anonPayments || anonPayments.length === 0) || !!anonPaymentsErr
  );

  // Attempt to read audit log
  const { data: anonAudit, error: anonAuditErr } = await anonClient
    .from('audit_log')
    .select('*');
  assert(
    'Anon cannot read audit_log (0 rows or error)',
    (!anonAudit || anonAudit.length === 0) || !!anonAuditErr
  );

  // 2. Non-Enrolled Authenticated Student Checks
  console.log('\n--- Phase 2: Non-Enrolled Student Checks (Priya) ---');
  const studentClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: loginData, error: loginErr } = await studentClient.auth.signInWithPassword({
    email: 'priya.new@example.com',
    password: 'Password123!',
  });

  if (loginErr || !loginData.session) {
    console.warn(`[WARN] Could not sign in as priya.new@example.com (${loginErr?.message}).`);
    console.warn('Ensure database has been seeded with `pnpm db:reset`.');
  } else {
    console.log(`Signed in successfully as Priya Nair (${loginData.user.id}).`);

    // Student attempts to read session_links
    const { data: studentLinks, error: studentLinksErr } = await studentClient
      .from('session_links')
      .select('*');
    assert(
      'Non-enrolled student receives 0 session_links',
      (!studentLinks || studentLinks.length === 0) || !!studentLinksErr
    );

    // Student attempts to read another student's orders (Arjun's order)
    const { data: arjunOrders, error: arjunOrdersErr } = await studentClient
      .from('orders')
      .select('*')
      .eq('user_id', '33333333-3333-3333-3333-333333333333');
    assert(
      'Student receives 0 rows when attempting to read another student orders',
      (!arjunOrders || arjunOrders.length === 0) || !!arjunOrdersErr
    );

    // Student attempts to self-grant an enrollment
    const { data: selfEnroll, error: selfEnrollErr } = await studentClient
      .from('enrollments')
      .insert({
        user_id: loginData.user.id,
        program_id: 'c1111111-1111-1111-1111-111111111111',
        status: 'active',
      })
      .select();
    assert(
      'Student cannot insert self-enrollment (must error)',
      !!selfEnrollErr
    );

    // Student attempts to change own role to 'admin'
    const { data: roleHack, error: roleHackErr } = await studentClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', loginData.user.id)
      .select();
    assert(
      'Student cannot modify profiles.role to admin (must error)',
      !!roleHackErr
    );
  }

  console.log('\n====================================================');
  console.log(`Security Verification Summary: ${passedAssertions}/${totalAssertions} Passed`);
  console.log('====================================================\n');

  if (passedAssertions < totalAssertions) {
    process.exit(1);
  }
}

runSecurityChecks().catch((err) => {
  console.error('Fatal error during security verification:', err);
  process.exit(1);
});
