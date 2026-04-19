import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  _resetRateLimitStore,
  applyCors,
  checkRateLimit,
  requireMethod,
  stripSecretsFromError,
} from "../api/shared/security.js";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue(undefined),
    })),
  },
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

  it("does not set Access-Control-Allow-Origin for an unknown origin", () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "https://evil.example.com" },
    });

    const handled = applyCors(req, res);

    expect(handled).toBe(false);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("echoes the origin and sets Vary when it is on the default allowlist", () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "https://hushhtech.com" },
    });

    const handled = applyCors(req, res);

    expect(handled).toBe(false);
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

    const handled = applyCors(req, res);

    expect(handled).toBe(true);
    expect(res.statusCode).toBe(204);
  });

  it("returns false and sets no CORS origin when no origin header is present", () => {
    const { req, res } = createMockReqRes({ method: "POST" });

    const handled = applyCors(req, res);

    expect(handled).toBe(false);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows localhost when NODE_ENV is not production", () => {
    vi.stubEnv("NODE_ENV", "development");

    const { req, res } = createMockReqRes({
      method: "POST",
      headers: { origin: "http://localhost:5173" },
    });

    const handled = applyCors(req, res);

    expect(handled).toBe(false);
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

    const handled = applyCors(req, res);

    expect(handled).toBe(false);
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
