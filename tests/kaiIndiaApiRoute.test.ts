import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hasKaiIndiaCredentials = vi.fn();
const fetchKaiIndiaMarketOverview = vi.fn();
const getKaiIndiaInvestmentAdvice = vi.fn();

vi.mock("../api/shared/kaiIndiaService.js", () => ({
  hasKaiIndiaCredentials,
  fetchKaiIndiaMarketOverview,
  getKaiIndiaInvestmentAdvice,
}));

const createResponse = () => {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body: unknown;

  return {
    headers,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
    send(payload: unknown) {
      body = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
  };
};

describe("kai india route", () => {
  beforeEach(() => {
    hasKaiIndiaCredentials.mockReset();
    fetchKaiIndiaMarketOverview.mockReset();
    getKaiIndiaInvestmentAdvice.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("reports server availability on GET", async () => {
    hasKaiIndiaCredentials.mockReturnValue(true);
    const { default: handler } = await import("../api/kai-india.js");

    const req = { method: "GET" };
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      available: true,
      provider: "server",
    });
  });

  it("returns a 503 when server credentials are missing", async () => {
    hasKaiIndiaCredentials.mockReturnValue(false);
    const { default: handler } = await import("../api/kai-india.js");

    const req = {
      method: "POST",
      body: { action: "market-overview" },
    };
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({
      error: "Kai India unavailable",
      detail:
        "Kai India requires server-side Gemini credentials. Configure GEMINI_API_KEY on the server runtime.",
    });
  });

  it("returns market overview data through the server route", async () => {
    hasKaiIndiaCredentials.mockReturnValue(true);
    fetchKaiIndiaMarketOverview.mockResolvedValue({
      mutualFunds: [{ name: "Fund A", price: "NAV 100", change: "+10%" }],
      sips: [],
      topMovers: [],
      mtf: [],
      intraday: [],
      gold: [],
      silver: [],
      metals: [],
      priorAnalysis: "steady",
    });
    const { default: handler } = await import("../api/kai-india.js");

    const req = {
      method: "POST",
      body: { action: "market-overview" },
    };
    const res = createResponse();

    await handler(req, res);

    expect(fetchKaiIndiaMarketOverview).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      mutualFunds: [{ name: "Fund A" }],
      priorAnalysis: "steady",
    });
  });

  it("validates investment advice inputs before calling the server model", async () => {
    hasKaiIndiaCredentials.mockReturnValue(true);
    const { default: handler } = await import("../api/kai-india.js");

    const req = {
      method: "POST",
      body: {
        action: "investment-advice",
        amount: 100,
        days: 0,
        profile: "bad",
      },
    };
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(getKaiIndiaInvestmentAdvice).not.toHaveBeenCalled();
  });

  it("returns investment advice from the server model", async () => {
    hasKaiIndiaCredentials.mockReturnValue(true);
    getKaiIndiaInvestmentAdvice.mockResolvedValue({
      strategyName: "Equilibrium Shield",
      allocations: [{ assetName: "Asset A", allocationAmount: 5000 }],
    });
    const { default: handler } = await import("../api/kai-india.js");

    const req = {
      method: "POST",
      body: {
        action: "investment-advice",
        amount: 5000,
        days: 30,
        profile: "stability",
      },
    };
    const res = createResponse();

    await handler(req, res);

    expect(getKaiIndiaInvestmentAdvice).toHaveBeenCalledWith(
      5000,
      30,
      "stability"
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      strategyName: "Equilibrium Shield",
      allocations: [{ assetName: "Asset A", allocationAmount: 5000 }],
    });
  });
});
