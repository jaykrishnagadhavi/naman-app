/**
 * packages/shared/src/errors.ts
 * Brand voice auth error mapper for ABrainoConscious.
 * Translates Supabase technical error messages and codes into clear, calm, empathetic guidance.
 */

export interface AuthErrorLike {
  message?: string;
  code?: string;
  status?: number;
}

export function mapAuthError(
  error: AuthErrorLike | Error | string | null | undefined
): string {
  if (!error) {
    return '';
  }

  const rawMessage = typeof error === 'string' ? error : error.message || '';
  const code = (typeof error === 'object' && error && 'code' in error ? error.code : '') || '';
  const lowerMsg = rawMessage.toLowerCase();
  const lowerCode = code.toLowerCase();

  // 1. Invalid credentials / wrong password
  if (
    lowerCode === 'invalid_credentials' ||
    lowerMsg.includes('invalid login credentials') ||
    lowerMsg.includes('invalid email or password') ||
    lowerMsg.includes('wrong password')
  ) {
    return "We couldn't sign you in with those details. Please double-check your email and password, or use a sign-in link.";
  }

  // 2. Email not confirmed
  if (
    lowerCode === 'email_not_confirmed' ||
    lowerMsg.includes('email not confirmed') ||
    lowerMsg.includes('unverified email')
  ) {
    return "Your email hasn't been verified yet. Check your inbox for the confirmation link, or tap below to send a fresh one.";
  }

  // 3. User already exists
  if (
    lowerCode === 'user_already_exists' ||
    lowerMsg.includes('user already registered') ||
    lowerMsg.includes('email address already in use') ||
    lowerMsg.includes('already registered')
  ) {
    return "An account with this email already exists. Try signing in, or use 'Forgot password' if you need to reset it.";
  }

  // 4. Rate limits
  if (
    lowerCode === 'over_request_rate_limit' ||
    lowerCode === 'rate_limit_exceeded' ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('too many requests')
  ) {
    return "You've tried quite a few times in a short window. Take a calm breather for a few minutes and try again.";
  }

  // 5. Expired or invalid OTP / recovery link
  if (
    lowerCode === 'otp_expired' ||
    lowerMsg.includes('token has expired') ||
    lowerMsg.includes('token is invalid') ||
    lowerMsg.includes('link is invalid') ||
    lowerMsg.includes('expired or is invalid')
  ) {
    return "That sign-in link has expired or was already used. Request a fresh link below and we'll send it right away.";
  }

  // 6. Weak password
  if (
    lowerCode === 'weak_password' ||
    lowerMsg.includes('password should be at least') ||
    lowerMsg.includes('weak password')
  ) {
    return "Please choose a password with at least 8 characters to keep your account safe.";
  }

  // 7. Session expired
  if (
    lowerCode === 'session_expired' ||
    lowerMsg.includes('jwt expired') ||
    lowerMsg.includes('session expired')
  ) {
    return "Your session has ended. Please sign in again to continue.";
  }

  // 8. Blocked or disabled account
  if (
    lowerMsg.includes('blocked') ||
    lowerMsg.includes('disabled') ||
    lowerMsg.includes('access denied')
  ) {
    return 'Your account access has been restricted. Please reach out to our team at support@abrainoconscious.com for assistance.';
  }

  // Default calm fallback
  return 'Something unexpected happened on our side. Please give it another moment and try again.';
}

export interface AppErrorDetails {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  raw?: unknown;
}

/**
 * Extracts structured error information from any thrown value, especially PostgREST / Supabase errors.
 * Ensures technical codes, messages, hints, and details are preserved for display and debugging.
 */
export function extractAppError(
  err: unknown,
  fallback = 'An unexpected error occurred'
): AppErrorDetails {
  if (!err) {
    return { message: fallback };
  }

  if (typeof err === 'string') {
    return { message: err };
  }

  if (typeof err === 'object') {
    const obj = err as Record<string, any>;
    const message =
      typeof obj.message === 'string' && obj.message.trim()
        ? obj.message
        : typeof obj.error_description === 'string' && obj.error_description.trim()
        ? obj.error_description
        : fallback;

    const code =
      typeof obj.code === 'string' && obj.code.trim()
        ? obj.code
        : typeof obj.status === 'number'
        ? String(obj.status)
        : undefined;

    const details =
      typeof obj.details === 'string' && obj.details.trim()
        ? obj.details
        : undefined;

    const hint =
      typeof obj.hint === 'string' && obj.hint.trim()
        ? obj.hint
        : undefined;

    return { message, code, details, hint, raw: err };
  }

  if (err instanceof Error) {
    return { message: err.message || fallback, raw: err };
  }

  return { message: String(err) || fallback, raw: err };
}

