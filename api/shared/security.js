/**
 * api/shared/security.js
 *
 * Fail-closed security envelope for serverless vendor-proxy endpoints.
 *
 * Origin policy: state-changing requests (POST/PUT/PATCH/DELETE) with a
 * missing or blocked Origin are rejected 403 before any side effect runs.
 * CORS headers are a browser-side control; this module enforces the policy
 * server-side so non-browser callers cannot bypass it by omitting headers.
 *
 * Rate-limit IP: the rightmost X-Forwarded-For entry is the trusted value.
 * On Vercel and Cloud Run the platform appends exactly one entry (the real
 * client IP), so rotating the leftmost (caller-controlled) entry does not
 * change the rate-limit bucket. Client identity is SHA-256(ip|UA) to raise
 * the cost of evasion. A per-key global cap provides a ceiling even when an
 * attacker rotates both IP and UA indefinitely.
 */

import { createHash } from 'node:crypto';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://hushhtech.com',
  'https://hushh-tech.vercel.app',
];

const LOCALHOST_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];

const IDEMPOTENT = new Set(['GET', 'HEAD']);

function parseAllowedOrigins() {
  const raw = process.env.API_ALLOWED_ORIGINS;
  if (!raw?.trim()) return [...DEFAULT_ALLOWED_ORIGINS];
  return raw.split(',').map((v) => v.trim()).filter(Boolean);
}

function isOriginAllowed(origin) {
  if (!origin) return false;
  const list = parseAllowedOrigins();
  if (list.includes(origin)) return true;
  if (process.env.NODE_ENV !== 'production') {
    return LOCALHOST_PATTERNS.some((p) => p.test(origin));
  }
  return false;
}

/**
 * Apply CORS policy and handle OPTIONS preflights. Fails closed: blocked or
 * missing-Origin state-changing requests are rejected 403; OPTIONS with
 * missing Origin returns 400. GET/HEAD with missing Origin are allowed through
 * without CORS headers (same-origin / server-to-server reads).
 *
 * @param {object} req
 * @param {object} res
 * @param {string[]} [allowedMethods] uppercase methods the endpoint accepts
 * @returns {{ done: boolean, allowed: boolean }}
 *   done:true  — response already sent; caller must return immediately.
 *   done:false — continue with handler logic; allowed is always true here.
 */
export function applyCors(req, res, allowedMethods = ['GET', 'POST', 'OPTIONS']) {
  const origin = req?.headers?.origin;
  const method = (req?.method || 'GET').toUpperCase();
  const advertised = [...new Set([...allowedMethods.map((m) => m.toUpperCase()), 'OPTIONS'])];

  if (method === 'OPTIONS') {
    if (!origin) {
      res.status(400).json({ error: 'Invalid preflight' });
      return { done: true, allowed: false };
    }
    if (!isOriginAllowed(origin)) {
      res.status(403).end();
      return { done: true, allowed: false };
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', advertised.join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
    res.status(204).end();
    return { done: true, allowed: true };
  }

  if (IDEMPOTENT.has(method)) {
    if (origin && !isOriginAllowed(origin)) {
      res.status(403).end();
      return { done: true, allowed: false };
    }
    if (origin && isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    return { done: false, allowed: true };
  }

  // State-changing methods (POST / PUT / PATCH / DELETE)
  if (!origin) {
    console.warn('[security] state-changing request rejected: no Origin');
    res.status(403).end();
    return { done: true, allowed: false };
  }
  if (!isOriginAllowed(origin)) {
    res.status(403).end();
    return { done: true, allowed: false };
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  return { done: false, allowed: true };
}

/**
 * Extract the trusted client identifier from a request.
 * Uses the rightmost X-Forwarded-For entry (platform-appended on Vercel /
 * Cloud Run). Falls back to X-Real-IP, socket.remoteAddress, then 'unknown'.
 * Returns SHA-256(ip|user-agent)[0..16] to raise the cost of pure-IP evasion.
 * @internal
 */
export function _getClientId(req) {
  const xff = req?.headers?.['x-forwarded-for'];
  let ip;
  if (typeof xff === 'string') {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) ip = parts[parts.length - 1]; // rightmost = trusted
  }
  if (!ip) {
    const xri = req?.headers?.['x-real-ip'];
    if (typeof xri === 'string' && xri.trim()) ip = xri.trim();
  }
  if (!ip) ip = req?.socket?.remoteAddress || 'unknown';
  const ua = req?.headers?.['user-agent'] || '';
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 16);
}

/** @type {Map<string, number[]>} per-client sliding-window timestamps */
const rateLimitStore = new Map();
/** @type {Map<string, number[]>} per-key global sliding-window timestamps */
const globalRateLimitStore = new Map();

/**
 * Sliding-window rate limiter keyed on trusted client identity.
 * Checks a per-client bucket first, then a per-key global cap that bounds
 * full-spoof attacks that rotate both IP and User-Agent.
 *
 * @param {object} req
 * @param {{ key: string, limit: number, windowMs: number, globalCap?: number }} opts
 * @returns {{ allowed: boolean, remaining: number, retryAfterSec: number, reason?: string }}
 */
export function checkRateLimit(req, opts) {
  const key = opts?.key || 'default';
  const limit = Number.isFinite(opts?.limit) ? opts.limit : 60;
  const windowMs = Number.isFinite(opts?.windowMs) ? opts.windowMs : 60_000;
  const globalCap = Number.isFinite(opts?.globalCap) ? opts.globalCap : limit * 10;
  const clientId = _getClientId(req);
  const storeKey = `${key}:${clientId}`;
  const now = Date.now();

  const entries = rateLimitStore.get(storeKey) || [];
  const fresh = entries.filter((ts) => now - ts < windowMs);

  if (fresh.length >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((fresh[0] + windowMs - now) / 1000));
    rateLimitStore.set(storeKey, fresh);
    return { allowed: false, remaining: 0, retryAfterSec, reason: 'per-client' };
  }

  const gEntries = globalRateLimitStore.get(key) || [];
  const gFresh = gEntries.filter((ts) => now - ts < windowMs);

  if (gFresh.length >= globalCap) {
    const retryAfterSec = Math.max(1, Math.ceil((gFresh[0] + windowMs - now) / 1000));
    globalRateLimitStore.set(key, gFresh);
    return { allowed: false, remaining: 0, retryAfterSec, reason: 'global' };
  }

  fresh.push(now);
  rateLimitStore.set(storeKey, fresh);
  gFresh.push(now);
  globalRateLimitStore.set(key, gFresh);
  return { allowed: true, remaining: Math.max(0, limit - fresh.length), retryAfterSec: 0 };
}

/**
 * Clear both rate-limit stores. Intended for tests only.
 * @internal
 */
export function _resetRateLimitStore() {
  rateLimitStore.clear();
  globalRateLimitStore.clear();
}

/**
 * Enforce an allowed-methods list. Returns 405 with an Allow header on
 * mismatch. Caller must early-return when this returns true.
 */
export function requireMethod(req, res, methods) {
  const allowed = Array.isArray(methods) ? methods : [];
  if (allowed.includes(req?.method || '')) return false;
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json({ error: 'Method not allowed' });
  return true;
}

const ENV_VAR_NAMES = [
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GMAIL_APP_PASSWORD',
  'GOOGLE_WALLET_PRIVATE_KEY',
];

const SECRET_PATTERN_REPLACEMENTS = /** @type {[RegExp, string][]} */ ([
  [/Bearer\s+[A-Za-z0-9_\-.]+/gi, '[redacted]'],
  [/sk-[A-Za-z0-9_\-]{20,}/g, '[redacted]'],
  [/AIza[0-9A-Za-z_\-]{20,}/g, '[redacted]'],
  // Query-string secret params: ?api_key=VALUE or &token=VALUE etc.
  [/(\?|&)(api[_-]?key|token|access[_-]?token|secret|password)=[^&\s]+/gi, '$1$2=[redacted]'],
]);

/**
 * Convert an error-like value to a client-safe string. Redacts common vendor
 * secrets, env var names, and query-string secret parameters.
 */
export function stripSecretsFromError(err) {
  if (err === null || err === undefined) return 'Internal error';
  let message;
  if (typeof err === 'string') {
    message = err;
  } else if (err instanceof Error) {
    message = err.message || '';
  } else if (typeof err === 'object') {
    message = typeof err.message === 'string' ? err.message : '';
  } else {
    message = String(err);
  }
  if (!message) return 'Internal error';
  let out = message;
  for (const name of ENV_VAR_NAMES) {
    out = out.split(name).join('[redacted]');
  }
  for (const [pattern, replacement] of SECRET_PATTERN_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  if (!out.trim()) return 'Internal error';
  return out;
}
