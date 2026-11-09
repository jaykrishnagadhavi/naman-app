const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envLocalPath = path.join(__dirname, '../.env.local');
  const envPath = path.join(__dirname, '../apps/admin/.env');
  const env = {};
  for (const file of [envPath, envLocalPath]) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          env[key] = val;
        }
      }
    }
  }
  return env;
}

async function inspectDb() {
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.log('No service key found');
    return;
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  // Query programs
  const { data: progs, error: pErr } = await adminClient
    .from('programs')
    .select('id, title, type, status')
    .limit(5);

  console.log('Programs in remote DB:', progs ? progs.length : 0);
  if (progs && progs.length > 0) {
    console.log('Sample program:', progs[0]);
  }

  // Query admins
  const { data: admins, error: aErr } = await adminClient
    .from('profiles')
    .select('id, role')
    .in('role', ['admin', 'staff'])
    .limit(5);

  console.log('Admins/staff in remote DB:', admins ? admins.length : 0);
  if (admins && admins.length > 0) {
    console.log('Sample admin profile:', admins[0]);
  }

  // Test calling upsert_session_with_links directly with service client
  if (progs && progs.length > 0 && admins && admins.length > 0) {
    console.log('\n--- Testing RPC with real program ID ---');
    const testProgramId = progs[0].id;
    
    // Test 1: upsert_session_with_links
    const payload1 = {
      p_program_id: testProgramId,
      p_day_number: 1,
      p_title: 'Day 1: Test',
      p_scheduled_at: new Date().toISOString(),
      p_session_id: null,
      p_description: 'Test description',
      p_live_platform: 'zoom',
      p_status: 'scheduled',
      p_task_title: 'Test task',
      p_task_body: '<p>Test task body</p>',
      p_resources: [],
      p_live_url: null,
      p_recording_url: null,
      p_recording_visible: false,
      p_is_link_published: false,
    };

    const res1 = await adminClient.rpc('upsert_session_with_links', payload1);
    console.log('upsert_session_with_links with service role:', res1.status, res1.error || res1.data);

    // Test 2: generate_challenge_schedule
    const genPayload = {
      p_program_id: testProgramId,
      p_start_date: '2026-11-10',
      p_daily_time_ist: '07:00:00',
      p_total_days: 7,
      p_overwrite: true,
    };

    const res2 = await adminClient.rpc('generate_challenge_schedule', genPayload);
    console.log('generate_challenge_schedule with service role:', res2.status, res2.error || res2.data);
  }
}

inspectDb().catch(console.error);

