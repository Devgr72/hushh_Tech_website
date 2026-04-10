import { describe, expect, it } from "vitest";

import geminiEphemeralTokenHandler from "../api/gemini-ephemeral-token.js";

const createResponse = () => {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body: unknown;
  let ended = false;

  return {
    headers,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    get ended() {
      return ended;
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
    end(payload?: unknown) {
      body = payload;
      ended = true;
      return this;
    },
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
  };
};

describe("gemini ephemeral token route", () => {
  it("returns a safe unavailable status for GET requests", async () => {
    const req = { method: "GET" };
    const res = createResponse();

    await geminiEphemeralTokenHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.body).toEqual({
      available: false,
      provider: "none",
      message:
        "Kai Live is temporarily unavailable while we finish the secure server-side Gemini transport.",
    });
  });

  it("fails closed for POST requests without returning a wsUrl", async () => {
    const req = { method: "POST", body: { persona: "Everyday Investor" } };
    const res = createResponse();

    await geminiEphemeralTokenHandler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({
      error: "Gemini Live unavailable",
      detail:
        "Kai Live is temporarily unavailable while we finish the secure server-side Gemini transport.",
      available: false,
    });
    expect(res.body).not.toHaveProperty("wsUrl");
  });

  it("handles preflight requests", async () => {
    const req = { method: "OPTIONS" };
    const res = createResponse();

    await geminiEphemeralTokenHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.ended).toBe(true);
  });
});
