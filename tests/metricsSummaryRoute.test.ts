import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();
const createClientMock = vi.fn(() => ({
  rpc: rpcMock,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args) => createClientMock(...args),
}));

import metricsSummaryHandler from "../api/metrics/summary.js";

const createResponse = () => {
  let statusCode = 200;
  let body;
  const headers = new Map();

  return {
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    get headers() {
      return headers;
    },
    setHeader(key, value) {
      headers.set(key, value);
      return this;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
};

describe("metrics summary API route", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("rejects non-GET requests", async () => {
    const res = createResponse();

    await metricsSummaryHandler({ method: "POST", query: {} }, res);

    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: "Method not allowed. Use GET." });
  });

  it("uses SUPABASE_URL when the server env is present", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    rpcMock.mockResolvedValue({
      data: { kpi: { raw_signups: 30 } },
      error: null,
    });

    const res = createResponse();
    await metricsSummaryHandler(
      { method: "GET", query: { window_days: "7" } },
      res
    );

    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    expect(rpcMock).toHaveBeenCalledWith("get_metrics_summary", {
      window_days: 7,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { kpi: { raw_signups: 30 } },
    });
  });

  it("fails closed when Supabase env is missing", async () => {
    const res = createResponse();

    await metricsSummaryHandler(
      { method: "GET", query: { window_days: "7" } },
      res
    );

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: "Server configuration error",
      hint: "Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY",
    });
  });
});
