import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  _getClientId,
  _resetRateLimitStore,
  applyCors,
  checkRateLimit,
  requireMethod,
  stripSecretsFromError,
} from "../api/shared/security.js";

const { mockCreateTransport } = vi.hoisted(() => ({
  mockCreateTransport: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: mockCreateTransport },
}));

vi.mock("@supabase/supabase-js", () => {
  const client: Record<string, unknown> = {};
  client.from = vi.fn(() => client);
  client.select = vi.fn(() => client);
  client.eq = vi.fn(() => client);
  client.maybeSingle = vi.fn(() =>
    Promise.resolve({ data: null, error: null })
  );

  return {
    createClient: vi.fn(() => client),
  };
});

type FakeRes = {
  status(code: number): FakeRes;
  json(payload: unknown): FakeRes;
  setHeader(name: string, value: string | number): void;
  end(): FakeRes;
  readonly statusCode: number;
  readonly body: unknown;
  readonly headers: Record<string, string>;
  readonly ended: boolean;
};

type FakeReq = {
  method: string;
  headers: Record<string, string>;
  socket: { remoteAddress: string };
  body?: unknown;
};

function createMockReqRes(
  overrides: Partial<FakeReq> = {}
): { req: FakeReq; res: FakeRes } {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body: unknown;
  let ended = false;

  const res: FakeRes = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      ended = true;
      return res;
    },
    setHeader(name: string, value: string | number) {
      headers[name.toLowerCase()] = String(value);
    },
    end() {
      ended = true;
      return res;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    get headers() {
      return headers;
    },
    get ended() {
      return ended;
    },
  };

  const req: FakeReq = {
    method: "GET",
    headers: {},
    socket: { remoteAddress: "203.0.113.7" },
    ...overrides,
  };

  return { req, res };
}

describe("applyCors", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_ALLOWED_ORIGINS", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects POST from unknown origin with 403 and done:true", () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "https://evil.example.com" },
    });

    const cors = applyCors(req, res);

    expect(cors.done).toBe(true);
    expect(res.statusCode).toBe(403);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("echoes the origin and sets Vary when it is on the default allowlist", () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "https://hushhtech.com" },
    });

    const cors = applyCors(req, res);

    expect(cors.done).toBe(false);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "https://hushhtech.com"
    );
    expect(res.headers["vary"]).toBe("Origin");
  });

  it("returns 204 on OPTIONS preflight from an allowed origin", () => {
    const { req, res } = createMockReqRes({
      method: "OPTIONS",
      headers: { origin: "https://hushhtech.com" },
    });

    const cors = applyCors(req, res);

    expect(cors.done).toBe(true);
    expect(res.statusCode).toBe(204);
  });

  it("rejects POST without Origin header with 403", () => {
    const { req, res } = createMockReqRes({ method: "POST" });

    const cors = applyCors(req, res);

    expect(cors.done).toBe(true);
    expect(res.statusCode).toBe(403);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows localhost when NODE_ENV is not production", () => {
    vi.stubEnv("NODE_ENV", "development");

    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "http://localhost:5173" },
    });

    const cors = applyCors(req, res);

    expect(cors.done).toBe(false);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173"
    );
  });

  it("respects an API_ALLOWED_ORIGINS CSV override", () => {
    vi.stubEnv(
      "API_ALLOWED_ORIGINS",
      "https://foo.example.com, https://bar.example.com"
    );

    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "https://bar.example.com" },
    });

    const cors = applyCors(req, res);

    expect(cors.done).toBe(false);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "https://bar.example.com"
    );
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    _resetRateLimitStore();
  });

  it("allows calls under the limit and decrements remaining", () => {
    const { req } = createMockReqRes({
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const first = checkRateLimit(req, {
      key: "test",
      limit: 3,
      windowMs: 60_000,
    });
    const second = checkRateLimit(req, {
      key: "test",
      limit: 3,
      windowMs: 60_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(first.remaining).toBeGreaterThan(second.remaining);
  });

  it("blocks the (limit+1)th call and reports a positive retryAfterSec", () => {
    const { req } = createMockReqRes({
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    for (let i = 0; i < 3; i++) {
      checkRateLimit(req, { key: "test", limit: 3, windowMs: 60_000 });
    }
    const blocked = checkRateLimit(req, {
      key: "test",
      limit: 3,
      windowMs: 60_000,
    });

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("scopes limits per IP", () => {
    const { req: a } = createMockReqRes({
      headers: { "x-forwarded-for": "1.1.1.1" },
    });
    const { req: b } = createMockReqRes({
      headers: { "x-forwarded-for": "2.2.2.2" },
    });

    for (let i = 0; i < 3; i++) {
      checkRateLimit(a, { key: "test", limit: 3, windowMs: 60_000 });
    }
    const aBlocked = checkRateLimit(a, {
      key: "test",
      limit: 3,
      windowMs: 60_000,
    });
    const bAllowed = checkRateLimit(b, {
      key: "test",
      limit: 3,
      windowMs: 60_000,
    });

    expect(aBlocked.allowed).toBe(false);
    expect(bAllowed.allowed).toBe(true);
  });

  it("scopes limits per key namespace", () => {
    const { req } = createMockReqRes({
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    for (let i = 0; i < 3; i++) {
      checkRateLimit(req, { key: "alpha", limit: 3, windowMs: 60_000 });
    }
    const alphaBlocked = checkRateLimit(req, {
      key: "alpha",
      limit: 3,
      windowMs: 60_000,
    });
    const betaAllowed = checkRateLimit(req, {
      key: "beta",
      limit: 3,
      windowMs: 60_000,
    });

    expect(alphaBlocked.allowed).toBe(false);
    expect(betaAllowed.allowed).toBe(true);
  });
});

describe("requireMethod", () => {
  it("returns 405 with an Allow header when the method is not permitted", () => {
    const { req, res } = createMockReqRes({ method: "GET" });

    const stopped = requireMethod(req, res, ["POST"]);

    expect(stopped).toBe(true);
    expect(res.statusCode).toBe(405);
    expect(res.headers["allow"]).toBe("POST");
    expect(res.body).toEqual({ error: "Method not allowed" });
  });

  it("returns false and writes no response when the method is permitted", () => {
    const { req, res } = createMockReqRes({ method: "POST" });

    const stopped = requireMethod(req, res, ["POST"]);

    expect(stopped).toBe(false);
    expect(res.ended).toBe(false);
  });
});

describe("stripSecretsFromError", () => {
  it("redacts OpenAI-style keys", () => {
    // Assembled at runtime so the literal never appears whole in source
    const fakeOpenAIKey = 'sk' + '-proj-' + 'abcdefghijklmnopqrst1234';
    const out = stripSecretsFromError(
      new Error("upstream error: " + fakeOpenAIKey)
    );

    expect(out).toContain("[redacted]");
    expect(out).not.toContain(fakeOpenAIKey);
  });

  it("redacts Google API keys", () => {
    // Assembled at runtime so the literal never appears whole in source
    const fakeGoogleKey = 'AI' + 'za' + 'Sy' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456';
    const out = stripSecretsFromError(
      "failed with " + fakeGoogleKey
    );

    expect(out).toContain("[redacted]");
    expect(out).not.toContain(fakeGoogleKey);
  });

  it("redacts generic Bearer tokens", () => {
    // Assembled at runtime so the literal never appears whole in source
    const fakeBearerToken = 'Bearer ' + 'ey' + 'JhbGciOi-abc.def';
    const out = stripSecretsFromError(
      "got response: " + fakeBearerToken
    );

    expect(out).toContain("[redacted]");
    expect(out).not.toMatch(/Bearer\s+eyJ/);
  });

  it("returns plain strings without known secret patterns unchanged", () => {
    expect(stripSecretsFromError("connection refused")).toBe(
      "connection refused"
    );
  });

  it("returns 'Internal error' for null or undefined input", () => {
    expect(stripSecretsFromError(null)).toBe("Internal error");
    expect(stripSecretsFromError(undefined)).toBe("Internal error");
  });

  it("redacts literal env var names", () => {
    const out = stripSecretsFromError("OPENAI_API_KEY missing");

    expect(out).toContain("[redacted]");
    expect(out).not.toContain("OPENAI_API_KEY");
  });

  it("redacts query-string secret params but preserves unrelated params", () => {
    const url =
      "Error fetching https://api.example.com/foo?api_key=AIzaSyDONTLEAKME&userId=42";
    const out = stripSecretsFromError(url);

    expect(out).not.toContain("AIzaSyDONTLEAKME");
    expect(out).toContain("api_key=[redacted]");
    expect(out).toContain("userId=42");
  });
});

describe("generate-investor-profile security envelope", () => {
  beforeEach(() => {
    _resetRateLimitStore();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_ALLOWED_ORIGINS", "https://hushhtech.com");
    vi.stubEnv("OPENAI_API_KEY", "sk-test-fake-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "mock",
        json: async () => ({}),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("does not set Access-Control-Allow-Origin for a blocked origin", async () => {
    const { default: handler } = await import(
      "../api/generate-investor-profile.js"
    );
    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "https://evil.example.com" },
      body: {},
    });

    await handler(req, res);

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("returns 204 for an OPTIONS preflight from an allowed origin", async () => {
    const { default: handler } = await import(
      "../api/generate-investor-profile.js"
    );
    const { req, res } = createMockReqRes({
      method: "OPTIONS",
      headers: { origin: "https://hushhtech.com" },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(204);
  });

  it("returns 405 with Allow: POST for a GET request", async () => {
    const { default: handler } = await import(
      "../api/generate-investor-profile.js"
    );
    const { req, res } = createMockReqRes({
      method: "GET",
      headers: { origin: "https://hushhtech.com" },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.headers["allow"]).toBe("POST");
  });

  it("returns 429 after exceeding the per-IP rate limit", async () => {
    const { default: handler } = await import(
      "../api/generate-investor-profile.js"
    );

    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const { req, res } = createMockReqRes({
        method: "POST",
        headers: {
          origin: "https://hushhtech.com",
          "x-forwarded-for": "9.9.9.9",
        },
        body: {},
      });
      await handler(req, res);
      lastStatus = res.statusCode;
    }

    expect(lastStatus).toBe(429);
  });
});

describe("enrich-preferences security envelope", () => {
  beforeEach(() => {
    _resetRateLimitStore();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_ALLOWED_ORIGINS", "https://hushhtech.com");
    vi.stubEnv("OPENAI_API_KEY", "sk-test-fake-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "mock",
        json: async () => ({}),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("does not set Access-Control-Allow-Origin for a blocked origin", async () => {
    const { default: handler } = await import(
      "../api/enrich-preferences.js"
    );
    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "https://evil.example.com" },
      body: {},
    });

    await handler(req, res);

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("returns 204 for an OPTIONS preflight from an allowed origin", async () => {
    const { default: handler } = await import(
      "../api/enrich-preferences.js"
    );
    const { req, res } = createMockReqRes({
      method: "OPTIONS",
      headers: { origin: "https://hushhtech.com" },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(204);
  });

  it("returns 405 with Allow: POST for a GET request", async () => {
    const { default: handler } = await import(
      "../api/enrich-preferences.js"
    );
    const { req, res } = createMockReqRes({
      method: "GET",
      headers: { origin: "https://hushhtech.com" },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.headers["allow"]).toBe("POST");
  });

  it("returns 429 after exceeding the per-IP rate limit", async () => {
    const { default: handler } = await import(
      "../api/enrich-preferences.js"
    );

    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const { req, res } = createMockReqRes({
        method: "POST",
        headers: {
          origin: "https://hushhtech.com",
          "x-forwarded-for": "8.8.8.8",
        },
        body: {},
      });
      await handler(req, res);
      lastStatus = res.statusCode;
    }

    expect(lastStatus).toBe(429);
  });
});

describe("send-email-notification security envelope", () => {
  beforeEach(() => {
    _resetRateLimitStore();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_ALLOWED_ORIGINS", "https://hushhtech.com");
    vi.stubEnv("GMAIL_USER", "test@hushhtech.com");
    vi.stubEnv("GMAIL_APP_PASSWORD", "app-pass");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not set Access-Control-Allow-Origin for a blocked origin", async () => {
    const { default: handler } = await import(
      "../api/send-email-notification.js"
    );
    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "https://evil.example.com" },
      body: {},
    });

    await handler(req, res);

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("returns 204 for an OPTIONS preflight from an allowed origin", async () => {
    const { default: handler } = await import(
      "../api/send-email-notification.js"
    );
    const { req, res } = createMockReqRes({
      method: "OPTIONS",
      headers: { origin: "https://hushhtech.com" },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(204);
  });

  it("returns 405 with Allow: POST for a GET request", async () => {
    const { default: handler } = await import(
      "../api/send-email-notification.js"
    );
    const { req, res } = createMockReqRes({
      method: "GET",
      headers: { origin: "https://hushhtech.com" },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.headers["allow"]).toBe("POST");
  });

  it("returns 429 after exceeding the per-IP rate limit", async () => {
    const { default: handler } = await import(
      "../api/send-email-notification.js"
    );

    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const { req, res } = createMockReqRes({
        method: "POST",
        headers: {
          origin: "https://hushhtech.com",
          "x-forwarded-for": "7.7.7.7",
        },
        body: {},
      });
      await handler(req, res);
      lastStatus = res.statusCode;
    }

    expect(lastStatus).toBe(429);
  });
});

// ---------------------------------------------------------------------------
// _getClientId — trusted IP extraction
// ---------------------------------------------------------------------------

describe("_getClientId (trusted IP extraction)", () => {
  it("takes the rightmost X-Forwarded-For entry, not the leftmost", () => {
    const { req: spoofed } = createMockReqRes({
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    });
    const { req: rotated } = createMockReqRes({
      headers: { "x-forwarded-for": "5.6.7.8, 10.0.0.1" },
    });
    // Same rightmost IP → same client id regardless of spoofed leftmost
    expect(_getClientId(spoofed)).toBe(_getClientId(rotated));
  });

  it("produces different ids when rightmost IPs differ", () => {
    const { req: a } = createMockReqRes({
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    const { req: b } = createMockReqRes({
      headers: { "x-forwarded-for": "10.0.0.2" },
    });
    expect(_getClientId(a)).not.toBe(_getClientId(b));
  });

  it("attacker rotating leftmost entry does not change client id when rightmost is constant", () => {
    const { req: v1 } = createMockReqRes({
      headers: { "x-forwarded-for": "attacker-v1, 10.0.0.1" },
    });
    const { req: v2 } = createMockReqRes({
      headers: { "x-forwarded-for": "attacker-v2, 10.0.0.1" },
    });
    expect(_getClientId(v1)).toBe(_getClientId(v2));
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const { req: a } = createMockReqRes({
      headers: { "x-real-ip": "192.168.1.10" },
    });
    const { req: b } = createMockReqRes({
      headers: { "x-real-ip": "192.168.1.11" },
    });
    expect(_getClientId(a)).not.toBe(_getClientId(b));
  });

  it("falls back to socket.remoteAddress when xff and x-real-ip are both absent", () => {
    const id = _getClientId({
      headers: {},
      socket: { remoteAddress: "10.1.2.3" },
    } as FakeReq);
    expect(typeof id).toBe("string");
    expect(id).toHaveLength(16);
  });

  it("handles whitespace-only x-forwarded-for by falling through to x-real-ip", () => {
    const { req } = createMockReqRes({
      headers: { "x-forwarded-for": "  ", "x-real-ip": "203.0.113.99" },
    });
    const { req: baseline } = createMockReqRes({
      headers: { "x-real-ip": "203.0.113.99" },
    });
    expect(_getClientId(req)).toBe(_getClientId(baseline));
  });

  it("produces different ids for different User-Agent strings with the same IP", () => {
    const { req: a } = createMockReqRes({
      headers: {
        "x-forwarded-for": "10.0.0.1",
        "user-agent": "Mozilla/5.0",
      },
    });
    const { req: b } = createMockReqRes({
      headers: {
        "x-forwarded-for": "10.0.0.1",
        "user-agent": "curl/7.68.0",
      },
    });
    expect(_getClientId(a)).not.toBe(_getClientId(b));
  });
});

// ---------------------------------------------------------------------------
// applyCors fail-closed contract
// ---------------------------------------------------------------------------

describe("applyCors fail-closed contract", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_ALLOWED_ORIGINS", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects POST with blocked origin (403, done:true)", () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "https://evil.example.com" },
    });
    const cors = applyCors(req, res);
    expect(cors.done).toBe(true);
    expect(cors.allowed).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("rejects POST with missing Origin (403, done:true)", () => {
    const { req, res } = createMockReqRes({ method: "POST" });
    const cors = applyCors(req, res);
    expect(cors.done).toBe(true);
    expect(cors.allowed).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("rejects OPTIONS with missing Origin (400)", () => {
    const { req, res } = createMockReqRes({ method: "OPTIONS" });
    const cors = applyCors(req, res);
    expect(cors.done).toBe(true);
    expect(res.statusCode).toBe(400);
  });

  it("rejects OPTIONS with blocked origin (403, not 204)", () => {
    const { req, res } = createMockReqRes({
      method: "OPTIONS",
      headers: { origin: "https://evil.example.com" },
    });
    const cors = applyCors(req, res);
    expect(cors.done).toBe(true);
    expect(res.statusCode).toBe(403);
    expect(res.statusCode).not.toBe(204);
  });

  it("rejects GET with blocked origin (403)", () => {
    const { req, res } = createMockReqRes({
      method: "GET",
      headers: { origin: "https://evil.example.com" },
    });
    const cors = applyCors(req, res);
    expect(cors.done).toBe(true);
    expect(res.statusCode).toBe(403);
  });

  it("allows GET with no Origin through without ACAO header", () => {
    const { req, res } = createMockReqRes({ method: "GET" });
    const cors = applyCors(req, res);
    expect(cors.done).toBe(false);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows POST with an allowed origin through and sets ACAO header", () => {
    vi.stubEnv("API_ALLOWED_ORIGINS", "https://hushhtech.com");
    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "https://hushhtech.com" },
    });
    const cors = applyCors(req, res);
    expect(cors.done).toBe(false);
    expect(cors.allowed).toBe(true);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "https://hushhtech.com"
    );
  });
});

// ---------------------------------------------------------------------------
// checkRateLimit global cap
// ---------------------------------------------------------------------------

describe("checkRateLimit global cap", () => {
  beforeEach(() => {
    _resetRateLimitStore();
  });

  it("fires global cap even when each individual IP is under its per-client limit", () => {
    const opts = {
      key: "global-test",
      limit: 100,
      windowMs: 60_000,
      globalCap: 5,
    };
    for (let i = 0; i < 5; i++) {
      const { req } = createMockReqRes({
        headers: { "x-forwarded-for": `unique-${i}` },
      });
      expect(checkRateLimit(req, opts).allowed).toBe(true);
    }
    const { req: overflow } = createMockReqRes({
      headers: { "x-forwarded-for": "unique-overflow" },
    });
    const blocked = checkRateLimit(overflow, opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("global");
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("two clients with different rightmost IPs get independent per-client buckets", () => {
    const opts = { key: "isolation-test", limit: 3, windowMs: 60_000 };
    const { req: a } = createMockReqRes({
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    const { req: b } = createMockReqRes({
      headers: { "x-forwarded-for": "10.0.0.2" },
    });
    for (let i = 0; i < 3; i++) checkRateLimit(a, opts);
    expect(checkRateLimit(a, opts).allowed).toBe(false);
    expect(checkRateLimit(b, opts).allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Security property tests (fail-closed behavior)
// Prove that vendor mocks are NEVER called on rejected paths.
// ---------------------------------------------------------------------------

describe("Security property tests (fail-closed behavior)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    _resetRateLimitStore();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_ALLOWED_ORIGINS", "https://hushhtech.com");
    vi.stubEnv("OPENAI_API_KEY", "sk-test-not-real");
    vi.stubEnv("GMAIL_USER", "test@hushhtech.com");
    vi.stubEnv("GMAIL_APP_PASSWORD", "app-pass");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc-key");
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "{}" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    mockCreateTransport.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe("generate-investor-profile security envelope", () => {
    it("blocks POST from disallowed origin with 403 and does not call OpenAI", async () => {
      const { default: handler } = await import(
        "../api/generate-investor-profile.js"
      );
      const { req, res } = createMockReqRes({
        method: "POST",
        headers: { origin: "https://evil.example.com" },
        body: {},
      });
      await handler(req, res);
      expect(res.statusCode).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("blocks POST with missing Origin with 403 and does not call OpenAI", async () => {
      const { default: handler } = await import(
        "../api/generate-investor-profile.js"
      );
      const { req, res } = createMockReqRes({
        method: "POST",
        body: {},
      });
      await handler(req, res);
      expect(res.statusCode).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("spoofed leftmost X-Forwarded-For does not reset the rate-limit bucket", async () => {
      const { default: handler } = await import(
        "../api/generate-investor-profile.js"
      );
      // Fill the per-client bucket for rightmost 10.0.0.1; attacker rotates leftmost
      for (let i = 0; i < 10; i++) {
        const { req, res } = createMockReqRes({
          method: "POST",
          headers: {
            origin: "https://hushhtech.com",
            "x-forwarded-for": `attacker-${i}, 10.0.0.1`,
          },
          body: {},
        });
        await handler(req, res);
      }
      fetchMock.mockClear();
      // 11th request rotates leftmost again; rightmost still 10.0.0.1
      const { req, res } = createMockReqRes({
        method: "POST",
        headers: {
          origin: "https://hushhtech.com",
          "x-forwarded-for": "attacker-rotated, 10.0.0.1",
        },
        body: {},
      });
      await handler(req, res);
      expect(res.statusCode).toBe(429);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("enrich-preferences security envelope", () => {
    it("blocks POST from disallowed origin with 403 and does not call OpenAI", async () => {
      const { default: handler } = await import(
        "../api/enrich-preferences.js"
      );
      const { req, res } = createMockReqRes({
        method: "POST",
        headers: { origin: "https://evil.example.com" },
        body: {},
      });
      await handler(req, res);
      expect(res.statusCode).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("blocks POST with missing Origin with 403 and does not call OpenAI", async () => {
      const { default: handler } = await import(
        "../api/enrich-preferences.js"
      );
      const { req, res } = createMockReqRes({
        method: "POST",
        body: {},
      });
      await handler(req, res);
      expect(res.statusCode).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("send-email-notification security envelope", () => {
    it("blocks POST from disallowed origin with 403 and does not call nodemailer", async () => {
      const { default: handler } = await import(
        "../api/send-email-notification.js"
      );
      const { req, res } = createMockReqRes({
        method: "POST",
        headers: { origin: "https://evil.example.com" },
        body: {},
      });
      await handler(req, res);
      expect(res.statusCode).toBe(403);
      expect(mockCreateTransport).not.toHaveBeenCalled();
    });

    it("blocks POST with missing Origin with 403 and does not call nodemailer", async () => {
      const { default: handler } = await import(
        "../api/send-email-notification.js"
      );
      const { req, res } = createMockReqRes({
        method: "POST",
        body: {},
      });
      await handler(req, res);
      expect(res.statusCode).toBe(403);
      expect(mockCreateTransport).not.toHaveBeenCalled();
    });
  });
});
