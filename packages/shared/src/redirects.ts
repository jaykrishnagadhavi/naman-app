/**
 * packages/shared/src/redirects.ts
 * Safe redirect and program slug sanitization helpers.
 * Prevents open redirects, protocol-relative exploits (//evil.com),
 * backslash evasion (/\evil.com, \\evil.com), and pseudo-protocols (javascript:, data:).
 */

/**
 * Validates and sanitizes a relative redirect path (`next` query parameter).
 * Returns the sanitized same-origin relative path, or `fallback` if invalid/hostile.
 */
export function sanitizeRedirectPath(
  rawPath: string | null | undefined,
  fallback = '/'
): string {
  if (!rawPath || typeof rawPath !== 'string') {
    return fallback;
  }

  const trimmed = rawPath.trim();
  if (!trimmed) {
    return fallback;
  }

  // Must begin with a single slash '/'
  // Rejects protocol-relative ('//evil.com'), slash-backslash ('/\\evil.com'), or bare domains ('evil.com')
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Reject any backslashes anywhere in the string (used for Windows UNC and parser evasion)
  if (trimmed.includes('\\')) {
    return fallback;
  }

  // Strip control characters and check for pseudo-protocols (javascript:, data:, vbscript:)
  try {
    const unencoded = decodeURIComponent(trimmed).replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    const cleanSchemeCheck = unencoded.replace(/^\/+/, '');
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(cleanSchemeCheck)) {
      return fallback;
    }
  } catch {
    // Malformed URI encoding
    return fallback;
  }

  // Verify against URL constructor with a known dummy base to confirm it remains relative
  try {
    const dummyBase = 'https://abrainoconscious.local';
    const parsed = new URL(trimmed, dummyBase);
    if (parsed.origin !== dummyBase) {
      return fallback;
    }
    // Return path + query + hash
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Validates and extracts a safe program slug (for `program` query parameter).
 * Returns lowercase alphanumeric-hyphen-underscore slug, or empty string if invalid.
 */
export function sanitizeProgramSlug(
  rawSlug: string | null | undefined,
  fallback = ''
): string {
  if (!rawSlug || typeof rawSlug !== 'string') {
    return fallback;
  }

  const trimmed = rawSlug.trim().toLowerCase();
  if (!trimmed) {
    return fallback;
  }

  // Disallow full URLs, slashes, protocol schemes
  if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes(':') || trimmed.includes('?')) {
    return fallback;
  }

  // Must only contain alphanumeric characters, hyphens, and underscores
  if (!/^[a-z0-9_-]+$/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

/**
 * Resolves destination path after authentication or onboarding.
 * Prioritizes `program` slug -> `/programs/${slug}` if provided,
 * otherwise falls back to sanitized `next` path.
 */
export function resolvePostAuthPath(options?: {
  program?: string | null;
  next?: string | null;
  fallback?: string;
}): string {
  const fallback = options?.fallback || '/';
  const validProgram = sanitizeProgramSlug(options?.program);
  if (validProgram) {
    return `/programs/${validProgram}`;
  }

  return sanitizeRedirectPath(options?.next, fallback);
}

