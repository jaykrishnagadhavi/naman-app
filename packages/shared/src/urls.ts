/**
 * packages/shared/src/urls.ts
 * Cross-surface URL resolution helpers for ABrainoConscious monorepo.
 * Dynamic by environment: returns localhost ports in dev, subdomain domains in prod.
 * Never hardcodes root domain; dynamically reads from VITE_ROOT_DOMAIN.
 */

export function getRootDomain(): string {
  if (typeof process !== 'undefined' && process.env?.VITE_ROOT_DOMAIN) {
    return process.env.VITE_ROOT_DOMAIN;
  }
  if (typeof import.meta !== 'undefined') {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (metaEnv?.VITE_ROOT_DOMAIN) {
      return metaEnv.VITE_ROOT_DOMAIN;
    }
  }
  return 'abrainoconcious.com';
}

export function isDevEnvironment(): boolean {
  // If explicitly configured for production
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return false;
  }

  // Check process.env.NODE_ENV for development/test
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return true;
    }
  }

  // Check import.meta.env
  if (
    typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: { DEV?: boolean; MODE?: string } }).env
  ) {
    const metaEnv = (import.meta as unknown as { env?: { DEV?: boolean; MODE?: string } }).env;
    if (metaEnv?.DEV || metaEnv?.MODE === 'development' || metaEnv?.MODE === 'test') {
      return true;
    }
  }

  // Check browser window location hostname
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost')
    ) {
      return true;
    }
  }

  return false;
}

function normalizePath(path = ''): string {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Returns student web application base URL (Port 5173 in dev, app.<ROOT_DOMAIN> in prod).
 */
export function getAppUrl(path = ''): string {
  const cleanPath = normalizePath(path);
  if (isDevEnvironment()) {
    return `http://localhost:5173${cleanPath}`;
  }
  return `https://app.${getRootDomain()}${cleanPath}`;
}

/**
 * Returns administrative management console base URL (Port 5174 in dev, admin.<ROOT_DOMAIN> in prod).
 */
export function getAdminUrl(path = ''): string {
  const cleanPath = normalizePath(path);
  if (isDevEnvironment()) {
    return `http://localhost:5174${cleanPath}`;
  }
  return `https://admin.${getRootDomain()}${cleanPath}`;
}

/**
 * Returns public conversion landing site base URL (Port 5175 in dev, <ROOT_DOMAIN> in prod).
 */
export function getLandingUrl(path = ''): string {
  const cleanPath = normalizePath(path);
  if (isDevEnvironment()) {
    return `http://localhost:5175${cleanPath}`;
  }
  return `https://${getRootDomain()}${cleanPath}`;
}
