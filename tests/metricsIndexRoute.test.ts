import { describe, expect, it } from "vitest";

import metricsIndexHandler from "../api/metrics.js";

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

describe("metrics index API route", () => {
  it("returns a helpful index response for the base metrics path", async () => {
    const res = createResponse();

    await metricsIndexHandler({ method: "GET" }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      message: "Use the metrics summary endpoint or the public dashboard.",
      routes: {
        dashboard: "/metrics",
        summary: "/api/metrics/summary?window_days=7",
      },
    });
  });
});
