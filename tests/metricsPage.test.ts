// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMetricsSummaryMock = vi.fn();

vi.mock("../src/pages/metrics/metricsService", () => ({
  fetchMetricsSummary: (...args) => fetchMetricsSummaryMock(...args),
  METRICS_STREAM_FALLBACK_REFRESH_MS: 60_000,
  openMetricsSummaryStream: () => null,
  getAuditWarnings: () => [],
  formatRelativeTime: () => "just now",
  formatDate: (value: string) => value,
  formatNumber: (value: number) => String(value),
  formatPercent: (value: number) => `${value.toFixed(1)}%`,
}));

import MetricsDashboard from "../src/pages/metrics";

describe("MetricsDashboard", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    fetchMetricsSummaryMock.mockReset();

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
      vi.runOnlyPendingTimers();
    });
    container.remove();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders a visible error state instead of going blank when the metrics API fails", async () => {
    fetchMetricsSummaryMock.mockRejectedValue(
      new Error("Server configuration error")
    );

    await act(async () => {
      root.render(React.createElement(MetricsDashboard));
      await Promise.resolve();
      await Promise.resolve();
    });

    const metricsPage = container.querySelector("[data-page='metrics']");

    expect(metricsPage).not.toBeNull();
    expect(metricsPage?.className).toContain("bg-white");
    expect(container.textContent).toContain("Team KPI Board");
    expect(container.textContent).toContain("Server configuration error");
    expect(container.textContent).toContain("Try Again");
  });
});
