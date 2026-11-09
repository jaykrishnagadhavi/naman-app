import { z } from 'zod';

export const ClientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_ROOT_DOMAIN: z.string().min(1, 'VITE_ROOT_DOMAIN is required (default: abrainoconcious.com)'),
  VITE_RAZORPAY_KEY_ID: z.string().min(1, 'VITE_RAZORPAY_KEY_ID is required'),
  VITE_VIDEO_DOMAIN: z.string().min(1, 'VITE_VIDEO_DOMAIN is required (default: video.abrainoconcious.com)')
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;

export function loadClientEnv(rawEnv?: Record<string, unknown>): ClientEnv {
  const metaEnv = typeof import.meta !== 'undefined' && 'env' in import.meta
    ? (import.meta as unknown as { env?: Record<string, unknown> }).env
    : undefined;
  const envSource = rawEnv || metaEnv || {};

  // Apply safe fallback defaults for local development if not yet populated
  const safeEnv = {
    VITE_SUPABASE_URL: envSource.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
    VITE_SUPABASE_ANON_KEY: envSource.VITE_SUPABASE_ANON_KEY || 'placeholder_anon_key_for_scaffold',
    VITE_ROOT_DOMAIN: envSource.VITE_ROOT_DOMAIN || 'abrainoconcious.com',
    VITE_RAZORPAY_KEY_ID: envSource.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    VITE_VIDEO_DOMAIN: envSource.VITE_VIDEO_DOMAIN || 'video.abrainoconcious.com'
  };

  const parsed = ClientEnvSchema.safeParse(safeEnv);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`\n❌ [Environment Config Error] Missing or invalid environment variables:\n${errorDetails}\n`);
    throw new Error(`Environment validation failed:\n${errorDetails}`);
  }
  return parsed.data;
}

export function isDev(): boolean {
  if (typeof import.meta !== 'undefined' && 'env' in import.meta) {
    const env = (import.meta as unknown as { env?: { DEV?: boolean; MODE?: string } }).env;
    return Boolean(env?.DEV || env?.MODE === 'development');
  }
  return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
}


