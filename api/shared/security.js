/**
 * api/shared/security.js
 *
 * Shared security envelope helpers for serverless vendor-proxy endpoints.
 * Four helpers wrap the existing business logic in each handler:
 *   - applyCors             origin allowlist + preflight handling
 *   - checkRateLimit        per-IP sliding-window limiter
 *   - requireMethod         HTTP method guard with Allow header
 *   - stripSecretsFromError redact vendor keys/tokens before responding
 *
 * No npm dependencies; vanilla Node only.
 *
 * Rate-limit scope: the limiter stores counters in module-level memory,
 * so it is best-effort and per-instance. Vercel / Cloud Run can spin up
 * multiple instances, so a determined attacker can still fan out. For
 * durable cross-instance limiting, migrate to the existing
 * `hushh_ai_rate_limits` Supabase table (see api/delete-account-service.js
 * ~line 635). That migration is intentionally out of scope here.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  "https://hushhtech.com",
  "https://hushh-tech.vercel.app",
];

const LOCALHOST_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];

function parseAllowedOrigins() {
  const raw = process.env.API_ALLOWED_ORIGINS;
  if (!raw || !raw.trim()) {
    return [...DEFAULT_ALLOWED_ORIGINS];
  }
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin) {
  if (!origin) return false;
  const allowlist = parseAllowedOrigins();
  if (allowlist.includes(origin)) return true;
  if (process.env.NODE_ENV !== "production") {
    return LOCALHOST_PATTERNS.some((pattern) => pattern.test(origin));
  }
  return false;
}

/**
 * Apply CORS headers based on the origin allowlist and handle preflight.
 * Echoes the request origin back only if it is allowlisted; otherwise
 * omits the Access-Control-Allow-Origin header entirely (browsers then
 * block the cross-origin response). Server-to-server callers with no
 * Origin header are allowed through — browsers enforce CORS, not us.
 *
 * @param {{ method?: string, headers?: Record<string, string|undefined> }} req
 * @param {{ setHeader: (name: string, value: string) => void, status: (code: number) => any, end: () => void }} res
 * @returns {boolean} true when an OPTIONS preflight was handled; caller should early-return.
 */
export function applyCors(req, res) {
  const origin = req?.headers?.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "600");

  if (req?.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

/** @type {Map<string, number[]>} */
const rateLimitStore = new Map();

function resolveClientIp(req) {
  const xff = req?.headers?.["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    const first = xff.split(",")[0];
    if (first) return first.trim();
  }
  const xri = req?.headers?.["x-real-ip"];
  if (typeof xri === "string" && xri.length > 0) return xri.trim();
  return req?.socket?.remoteAddress || "unknown";
}

/**
 * Best-effort per-IP sliding-window rate limiter. In-memory, per-instance.
 *
 * @param {{ headers?: Record<string, string|undefined>, socket?: { remoteAddress?: string } }} req
 * @param {{ key: string, limit: number, windowMs: number }} opts
 * @returns {{ allowed: boolean, remaining: number, retryAfterSec: number }}
 */
export function checkRateLimit(req, opts) {
  const key = opts?.key || "default";
  const limit = Number.isFinite(opts?.limit) ? opts.limit : 60;
  const windowMs = Number.isFinite(opts?.windowMs) ? opts.windowMs : 60_000;
  const ip = resolveClientIp(req);
  const storeKey = `${key}:${ip}`;
  const now = Date.now();

  const entries = rateLimitStore.get(storeKey) || [];
  const fresh = entries.filter((ts) => now - ts < windowMs);

  if (fresh.length >= limit) {
    const oldest = fresh[0];
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );
    rateLimitStore.set(storeKey, fresh);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  fresh.push(now);
  rateLimitStore.set(storeKey, fresh);
  return {
    allowed: true,
    remaining: Math.max(0, limit - fresh.length),
    retryAfterSec: 0,
  };
}

/**
 * Clear the in-memory rate-limit store. Intended for tests only.
 * @internal
 */
export function _resetRateLimitStore() {
  rateLimitStore.clear();
}

/**
 * Enforce an allowed-methods list. Returns 405 with an Allow header on
 * mismatch. The caller should early-return when this returns true.
 *
 * @param {{ method?: string }} req
 * @param {{ setHeader: (name: string, value: string) => void, status: (code: number) => any }} res
 * @param {string[]} methods uppercase HTTP methods, e.g. ['POST']
 * @returns {boolean}
 */
export function requireMethod(req, res, methods) {
  const allowed = Array.isArray(methods) ? methods : [];
  if (allowed.includes(req?.method || "")) return false;

  res.setHeader("Allow", allowed.join(", "));
  res.status(405).json({ error: "Method not allowed" });
  return true;
}

const ENV_VAR_NAMES = [
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GMAIL_APP_PASSWORD",
  "GOOGLE_WALLET_PRIVATE_KEY",
];

const SECRET_PATTERNS = [
  /Bearer\s+[A-Za-z0-9_\-.]+/gi,
  /sk-[A-Za-z0-9_\-]{20,}/g,
  /AIza[0-9A-Za-z_\-]{20,}/g,
];

/**
 * Convert an error-like value to a client-safe string. Redacts common
 * vendor secrets and literal env var names. Never leaks stack traces.
 *
 * @param {unknown} err
 * @returns {string}
 */
export function stripSecretsFromError(err) {
  if (err === null || err === undefined) return "Internal error";

  let message;
  if (typeof err === "string") {
    message = err;
  } else if (err instanceof Error) {
    message = err.message || "";
  } else if (typeof err === "object") {
    message = typeof err.message === "string" ? err.message : "";
  } else {
    message = String(err);
  }

  if (!message) return "Internal error";

  let out = message;
  for (const name of ENV_VAR_NAMES) {
    out = out.split(name).join("[redacted]");
  }
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, "[redacted]");
  }
  if (!out.trim()) return "Internal error";
  return out;
}
