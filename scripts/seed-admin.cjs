/**
 * scripts/seed-admin.cjs
 * Creates or promotes administrator accounts based on ADMIN_EMAILS and SUPABASE_SERVICE_ROLE_KEY.
 * Reads environment variables from .env.local or .env.
 * Idempotent: safe to run multiple times.
 */

const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

// Load environment files (.env.local first, then .env)
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

const isLocalFlag = process.argv.includes('--local') || process.env.LOCAL === 'true';
const hasYesFlag = process.argv.includes('--yes') || process.argv.includes('-y');

const LOCAL_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const SUPABASE_URL = isLocalFlag
  ? 'http://127.0.0.1:54321'
  : (process.env.SUPABASE_URL || 'http://127.0.0.1:54321');

const SUPABASE_SERVICE_ROLE_KEY = isLocalFlag
  ? LOCAL_SERVICE_KEY
  : (process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SERVICE_KEY);

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required in .env.local or environment');
  process.exit(1);
}

// Helper: Check if URL points to a remote instance
function isRemoteUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return !['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

// Helper: Extract Supabase project ref from URL
function extractProjectRef(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname;
    const match = host.match(/^([a-z0-9_-]+)\.supabase\.(?:co|in)$/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

// Helper: Read CLI linked project ref from supabase/.temp
function getLinkedProjectRef() {
  const candidates = [
    path.resolve(process.cwd(), 'supabase/.temp/project-ref'),
    path.resolve(process.cwd(), '.temp/project-ref'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      const val = fs.readFileSync(file, 'utf8').trim();
      if (val) return val.toLowerCase();
    }
  }

  const jsonCandidates = [
    path.resolve(process.cwd(), 'supabase/.temp/linked-project.json'),
    path.resolve(process.cwd(), '.temp/linked-project.json'),
  ];
  for (const file of jsonCandidates) {
    if (fs.existsSync(file)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (parsed && parsed.ref) return parsed.ref.trim().toLowerCase();
      } catch {}
    }
  }

  return null;
}

// Safety check for remote projects
if (isRemoteUrl(SUPABASE_URL)) {
  const urlRef = extractProjectRef(SUPABASE_URL);
  const linkedRef = getLinkedProjectRef();

  if (!linkedRef) {
    console.error('Error: Supabase CLI is not linked to any project, but SUPABASE_URL points to a remote project.');
    console.error(`Link your project first: supabase link --project-ref ${urlRef || '<project-ref>'}`);
    process.exit(1);
  }

  if (urlRef && urlRef !== linkedRef) {
    console.error(
      `Error: Refusing to run. SUPABASE_URL project ref ("${urlRef}") does not match the linked CLI project ("${linkedRef}").`
    );
    console.error(`Run 'supabase link --project-ref ${urlRef}' to switch projects or update SUPABASE_URL.`);
    process.exit(1);
  }

  if (!hasYesFlag) {
    console.error(
      `Safety check: Target is a remote Supabase project ("${urlRef || linkedRef}").`
    );
    console.error('Pass the --yes flag to proceed: pnpm seed:admin -- --yes');
    process.exit(1);
  }
}

// Parse ADMIN_EMAILS (with fallback to ADMIN_EMAIL)
function getAdminEmails() {
  const raw =
    process.env.ADMIN_EMAILS !== undefined && process.env.ADMIN_EMAILS !== null && process.env.ADMIN_EMAILS.trim() !== ''
      ? process.env.ADMIN_EMAILS
      : (process.env.ADMIN_EMAIL || 'admin@abrainoconcious.com');

  const emails = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const unique = Array.from(new Set(emails));
  if (unique.length === 0) {
    console.error('Error: No valid admin emails found in ADMIN_EMAILS / ADMIN_EMAIL');
    process.exit(1);
  }

  return unique;
}

const adminEmails = getAdminEmails();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function getAllAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }
    users.push(...(data.users || []));
    if (!data.nextPage || !data.users || data.users.length < perPage) {
      break;
    }
    page = data.nextPage;
  }
  return users;
}

async function main() {
  const allUsers = await getAllAuthUsers();
  const summary = [];

  for (const email of adminEmails) {
    let authUser = allUsers.find(
      (u) => u.email && u.email.trim().toLowerCase() === email
    );
    let isNewlyCreated = false;

    if (!authUser) {
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
        },
      });

      if (createError) {
        console.error(`Failed to create auth user for ${email}: ${createError.message}`);
        process.exit(1);
      }

      authUser = createData.user;
      isNewlyCreated = true;
    }

    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, role, is_blocked')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileFetchError) {
      console.error(`Error querying profile for ${email}: ${profileFetchError.message}`);
      process.exit(1);
    }

    let outcome;
    if (isNewlyCreated) {
      outcome = 'created';
      if (!profile) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: authUser.id,
          role: 'admin',
          is_blocked: false,
        });
        if (insertError) {
          console.error(`Failed to create profile for ${email}: ${insertError.message}`);
          process.exit(1);
        }
      } else if (profile.role !== 'admin' || profile.is_blocked) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin', is_blocked: false, updated_at: new Date().toISOString() })
          .eq('id', authUser.id);
        if (updateError) {
          console.error(`Failed to promote profile for ${email}: ${updateError.message}`);
          process.exit(1);
        }
      }
    } else {
      if (!profile) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: authUser.id,
          role: 'admin',
          is_blocked: false,
        });
        if (insertError) {
          console.error(`Failed to insert profile for ${email}: ${insertError.message}`);
          process.exit(1);
        }
        outcome = 'promoted';
      } else if (profile.role !== 'admin' || profile.is_blocked) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin', is_blocked: false, updated_at: new Date().toISOString() })
          .eq('id', authUser.id);
        if (updateError) {
          console.error(`Failed to promote profile for ${email}: ${updateError.message}`);
          process.exit(1);
        }
        outcome = 'promoted';
      } else {
        outcome = 'already admin';
      }
    }

    summary.push({ email, outcome });
  }

  // Print only a summary of emails and outcomes (never print keys)
  console.log('Admin seed summary:');
  for (const item of summary) {
    console.log(`- ${item.email}: ${item.outcome}`);
  }
}

main().catch((err) => {
  console.error('Unexpected error in seed-admin:', err.message || err);
  process.exit(1);
});
