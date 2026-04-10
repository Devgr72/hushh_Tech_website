import { AdvisorResult, MarketData, MarketItem } from "../types";

const KAI_INDIA_ENDPOINT = "/api/kai-india";

function isValidMarketItem(item: MarketItem): boolean {
  const isInvalid = (value?: string) =>
    !value ||
    value === "N/A" ||
    value === "-" ||
    value.trim() === "" ||
    value.toLowerCase().includes("unknown");

  if (isInvalid(item.name)) return false;
  if (isInvalid(item.price)) return false;
  if (isInvalid(item.change)) return false;

  return true;
}

function normalizeMarketData(rawData: Partial<MarketData> | null | undefined): MarketData {
  return {
    mutualFunds: (rawData?.mutualFunds || []).filter(isValidMarketItem),
    sips: (rawData?.sips || []).filter(isValidMarketItem),
    topMovers: (rawData?.topMovers || []).filter(isValidMarketItem),
    mtf: (rawData?.mtf || []).filter(isValidMarketItem),
    intraday: (rawData?.intraday || []).filter(isValidMarketItem),
    gold: (rawData?.gold || []).filter(isValidMarketItem),
    silver: (rawData?.silver || []).filter(isValidMarketItem),
    metals: (rawData?.metals || []).filter(isValidMarketItem),
    priorAnalysis:
      rawData?.priorAnalysis || "Market data is currently being updated.",
  };
}

async function callKaiIndiaApi<T>(
  action: "market-overview" | "investment-advice",
  payload: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(KAI_INDIA_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      ...payload,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail =
      typeof errorBody?.detail === "string"
        ? errorBody.detail
        : typeof errorBody?.error === "string"
          ? errorBody.error
          : response.statusText;
    throw new Error(detail || "Kai India request failed");
  }

  return response.json() as Promise<T>;
}

export const fetchMarketOverview = async (): Promise<MarketData> => {
  try {
    const data = await callKaiIndiaApi<MarketData>("market-overview");
    return normalizeMarketData(data);
  } catch (error) {
    console.error("Error fetching market overview:", error);
    return {
      mutualFunds: [],
      sips: [],
      topMovers: [],
      mtf: [],
      intraday: [],
      gold: [],
      silver: [],
      metals: [],
      priorAnalysis:
        "Market data unavailable due to high traffic. Please try again shortly.",
    };
  }
};

export const getInvestmentAdvice = async (
  amount: number,
  days: number,
  profile: "stability" | "growth" | "max_profit"
): Promise<AdvisorResult> => {
  return callKaiIndiaApi<AdvisorResult>("investment-advice", {
    amount,
    days,
    profile,
  });
};
