import { expect, test } from "@playwright/test";

test.describe("metrics smoke", () => {
  test("serves a real metrics summary payload", async ({ request }) => {
    const response = await request.get("/api/metrics/summary?window_days=7");

    expect(response.status()).toBe(200);

    const payload = await response.json();

    expect(payload.success).toBe(true);
    expect(payload.data).toBeTruthy();
    expect(payload.data.kpi).toBeTruthy();
    expect(payload.data.totals).toBeTruthy();
    expect(Array.isArray(payload.data.daily)).toBe(true);
    expect(payload.data.audit).toBeTruthy();
  });

  test("renders the metrics dashboard without the config error state", async ({
    page,
  }) => {
    const summaryResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/api/metrics/summary?window_days=7") &&
        response.request().method() === "GET"
      );
    });

    await page.goto("/metrics", { waitUntil: "domcontentloaded" });

    const summaryResponse = await summaryResponsePromise;
    expect(summaryResponse.status()).toBe(200);

    const summaryPayload = await summaryResponse.json();
    expect(summaryPayload.success).toBe(true);

    const metricsRoot = page.locator("[data-page='metrics']");
    const kpiSection = page.getByLabel("Key Performance Indicators");
    const conversionSection = page.getByLabel("Conversion Rates");

    await expect(metricsRoot).toBeVisible();
    await expect(metricsRoot).toHaveClass(/bg-white/);
    await expect(
      page.getByRole("heading", { name: "Team KPI Board" })
    ).toBeVisible();
    await expect(kpiSection.getByText("Raw Signups")).toBeVisible();
    await expect(kpiSection.getByText("Profiles Confirmed")).toBeVisible();
    await expect(conversionSection.getByText("Conversion Rates")).toBeVisible();

    await expect(page.getByText("Server configuration error")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Try Again" })).toHaveCount(0);

    const rawSignupsCard = kpiSection
      .getByText("Raw Signups")
      .locator("xpath=ancestor::div[contains(@class,'group')][1]");
    await expect(rawSignupsCard).toContainText(/\d/);

    await expect(page.locator("div.h-32.animate-pulse")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Refresh metrics" })
    ).toHaveText("⟳ Refresh");
  });
});
