import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchMetricsSummary,
  openMetricsSummaryStream,
} from "../src/pages/metrics/metricsService";

const mockSummary = {
  window: {
    days: 7,
    start: "2026-04-10T00:00:00.000Z",
    end: "2026-04-16T00:00:00.000Z",
  },
  kpi: {
    raw_signups: 30,
    persisted_users: 12,
    onboarding_started: 9,
    onboarding_completed: 3,
    profiles_created: 3,
    profiles_confirmed: 1,
  },
  totals: {
    raw_signups: 30,
    persisted_users: 12,
    onboarding_started: 9,
    onboarding_completed: 3,
    profiles_created: 3,
    profiles_confirmed: 1,
  },
  conversions: {
    signup_to_persisted: 40,
    signup_to_onboarding: 30,
    onboarding_completion: 33.3,
    profile_confirmation: 33.3,
  },
  funnel: [],
  step_distribution: [],
  daily: [],
  audit: {
    latest_signup: null,
    latest_persisted: null,
    latest_onboarding: null,
    latest_profile: null,
    query_executed_at: "2026-04-16T00:00:00.000Z",
  },
};

function createResponse({
  ok,
  status,
  body,
  contentType = "application/json",
}: {
  ok: boolean;
  status: number;
  body: string;
  contentType?: string;
}) {
  return {
    ok,
    status,
    headers: new Headers({ "content-type": contentType }),
    text: vi.fn(async () => body),
  } as unknown as Response;
}

afterEach(() => {
  MockEventSource.instances = [];
  vi.restoreAllMocks();
});

class MockEventSource {
  static instances: MockEventSource[] = [];

  readonly url: string;
  private listeners = new Map<string, Set<(event: MessageEvent<string>) => void>>();
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    const bucket = this.listeners.get(type) || new Set();
    bucket.add(listener);
    this.listeners.set(type, bucket);
  }

  removeEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, payload: unknown) {
    const event = { data: JSON.stringify(payload) } as MessageEvent<string>;
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
}

describe("metricsService", () => {
  it("falls back to the direct local API when the proxied response is not JSON", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
      },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({
          ok: false,
          status: 500,
          body: "Internal Server Error",
          contentType: "text/plain",
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          ok: true,
          status: 200,
          body: JSON.stringify({
            success: true,
            data: mockSummary,
          }),
        })
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchMetricsSummary(7);

    expect(result).toEqual(mockSummary);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/metrics/summary?window_days=7",
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://127.0.0.1:3000/api/metrics/summary?window_days=7",
      expect.any(Object)
    );
  });

  it("throws a stable error when every candidate fails", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
      },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        createResponse({
          ok: false,
          status: 500,
          body: "Metrics backend unavailable",
          contentType: "text/plain",
        })
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchMetricsSummary(7)).rejects.toThrow(
      "Metrics backend unavailable"
    );
  });

  it("opens the direct local metrics stream and applies live snapshots", () => {
    const onSnapshot = vi.fn();
    const onStreamError = vi.fn();

    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
      },
      EventSource: MockEventSource,
    });

    const teardown = openMetricsSummaryStream(7, {
      onSnapshot,
      onStreamError,
    });

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]?.url).toBe(
      "http://127.0.0.1:3000/api/metrics/stream?window_days=7"
    );

    MockEventSource.instances[0]?.emit("snapshot", {
      success: true,
      data: mockSummary,
    });

    expect(onSnapshot).toHaveBeenCalledWith(mockSummary);
    expect(onStreamError).not.toHaveBeenCalled();

    teardown?.();
    expect(MockEventSource.instances[0]?.close).toHaveBeenCalled();
  });
});
