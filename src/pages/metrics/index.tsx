/**
 * Public KPI Dashboard — /metrics
 *
 * Supabase-powered team metrics board.
 * No authentication required. All data from Supabase RPC.
 * SEO: noindex, nofollow (internal analytics page).
 */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import type { MetricsSummary, KpiCardConfig, ConversionCardConfig } from "./types";
import {
  fetchMetricsSummary,
  getAuditWarnings,
  formatRelativeTime,
  METRICS_STREAM_FALLBACK_REFRESH_MS,
  openMetricsSummaryStream,
} from "./metricsService";
import KpiCard from "./components/KpiCard";
import ConversionCard from "./components/ConversionCard";
import FunnelChart from "./components/FunnelChart";
import DailyChart from "./components/DailyChart";
import StepDistribution from "./components/StepDistribution";
import DailyTable from "./components/DailyTable";
import AuditWarnings from "./components/AuditWarnings";
import {
  metricsEyebrowClass,
  metricsSectionTitleClass,
  metricsSurfaceClass,
  playfair,
} from "./theme";

/* ── KPI card configuration ── */
const KPI_CARDS: KpiCardConfig[] = [
  {
    label: "Raw Signups",
    key: "raw_signups",
    icon: "person_add",
    color: "#00A9E0",
    description: "Total auth.users registrations via OAuth or email",
  },
  {
    label: "Persisted Users",
    key: "persisted_users",
    icon: "storage",
    color: "#2563EB",
    description: "Users with a row in public.users (post-signup persistence)",
  },
  {
    label: "Onboarding Started",
    key: "onboarding_started",
    icon: "rocket_launch",
    color: "#475569",
    description: "Users who began the onboarding flow",
  },
  {
    label: "Onboarding Completed",
    key: "onboarding_completed",
    icon: "check_circle",
    color: "#10B981",
    description: "Users who finished all onboarding steps",
  },
  {
    label: "Profiles Created",
    key: "profiles_created",
    icon: "article",
    color: "#8B5CF6",
    description: "AI-generated investor profiles created",
  },
  {
    label: "Profiles Confirmed",
    key: "profiles_confirmed",
    icon: "verified",
    color: "#0F766E",
    description: "Investor profiles confirmed by the user",
  },
];

/* ── Conversion card configuration ── */
const CONVERSION_CARDS: ConversionCardConfig[] = [
  {
    label: "Signup → Persisted",
    key: "signup_to_persisted",
    fromLabel: "Signups",
    toLabel: "Persisted",
    color: "#00A9E0",
  },
  {
    label: "Signup → Onboarding",
    key: "signup_to_onboarding",
    fromLabel: "Signups",
    toLabel: "Started",
    color: "#475569",
  },
  {
    label: "Onboarding Completion",
    key: "onboarding_completion",
    fromLabel: "Started",
    toLabel: "Completed",
    color: "#10B981",
  },
  {
    label: "Profile Confirmation",
    key: "profile_confirmation",
    fromLabel: "Created",
    toLabel: "Confirmed",
    color: "#0F766E",
  },
];

/* ── Window options ── */
const WINDOW_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 0, label: "All time" },
];

const MetricsDashboard: React.FC = () => {
  const [data, setData] = useState<MetricsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState(7);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  /* Fetch metrics from API */
  const loadMetrics = useCallback(async (
    days: number,
    options: { background?: boolean } = {}
  ) => {
    if (!options.background) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await fetchMetricsSummary(days);
      setData(result);
      setLastFetched(new Date().toISOString());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load metrics";
      setError(message);
      console.error("[MetricsDashboard] Load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applySnapshot = useCallback((result: MetricsSummary) => {
    setData(result);
    setLastFetched(new Date().toISOString());
    setError(null);
    setIsLoading(false);
  }, []);

  /* Initial load + window change */
  useEffect(() => {
    loadMetrics(windowDays);
  }, [windowDays, loadMetrics]);

  /* Live updates via SSE */
  useEffect(() => {
    const teardown = openMetricsSummaryStream(windowDays, {
      onSnapshot: applySnapshot,
      onStreamError: (streamError) => {
        console.warn("[MetricsDashboard] Stream warning:", streamError.message);
      },
    });

    return () => {
      teardown?.();
    };
  }, [applySnapshot, windowDays]);

  /* Fallback refresh when streaming is unavailable or the tab wakes up */
  useEffect(() => {
    const interval = setInterval(() => {
      loadMetrics(windowDays, { background: true });
    }, METRICS_STREAM_FALLBACK_REFRESH_MS);

    return () => clearInterval(interval);
  }, [windowDays, loadMetrics]);

  useEffect(() => {
    const refreshMetrics = () => {
      void loadMetrics(windowDays, { background: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshMetrics();
      }
    };

    window.addEventListener("focus", refreshMetrics);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshMetrics);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [windowDays, loadMetrics]);

  /* Compute audit warnings */
  const auditWarnings = useMemo(() => {
    if (!data?.audit) return [];
    return getAuditWarnings(data.audit);
  }, [data?.audit]);

  /* Determine status indicator */
  const statusInfo = useMemo(() => {
    if (isLoading) {
      return {
        label: "Loading",
        badgeClassName: "border-gray-200 bg-gray-50 text-gray-500",
        dotClassName: "bg-gray-400 animate-pulse",
      };
    }
    if (error) {
      return {
        label: "Error",
        badgeClassName: "border-red-200 bg-red-50 text-red-500",
        dotClassName: "bg-red-500",
      };
    }
    if (auditWarnings.length > 0) {
      return {
        label: "Stale",
        badgeClassName: "border-amber-200 bg-amber-50 text-amber-600",
        dotClassName: "bg-amber-500",
      };
    }
    return {
      label: "Live",
      badgeClassName: "border-hushh-blue/20 bg-hushh-blue/5 text-hushh-blue",
      dotClassName: "bg-hushh-blue animate-pulse",
    };
  }, [isLoading, error, auditWarnings]);

  return (
    <div
      data-page="metrics"
      className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white"
    >
      {/* SEO: noindex meta tag */}
      {typeof document !== "undefined" && (
        <meta name="robots" content="noindex, nofollow" />
      )}

      <div className="w-full max-w-6xl mx-auto px-6 pb-20">
        {/* ═══════════════════════════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════════════════════════ */}
        <header className="pt-8 pb-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full mb-6 ${statusInfo.badgeClassName}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClassName}`}
                />
                <span className="text-[10px] tracking-[0.15em] uppercase font-medium">
                  {statusInfo.label}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                <span
                  className="text-[2.75rem] leading-[1.1] font-normal text-black tracking-tight"
                  style={playfair}
                >
                  Team KPI Board
                </span>
              </h1>
              <p className="text-[13px] text-gray-400 font-light mt-4 leading-relaxed max-w-xl">
                Supabase-powered business funnel metrics
              </p>
            </div>

            <div className={`${metricsSurfaceClass} w-full xl:w-auto p-4 sm:p-5`}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-1 rounded-full border border-gray-200/80 bg-gray-50 p-1">
                  {WINDOW_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setWindowDays(opt.value)}
                      className={`px-3.5 py-2 rounded-full text-[11px] font-medium transition-all ${
                        windowDays === opt.value
                          ? "bg-white text-black border border-gray-200 shadow-sm"
                          : "text-gray-500 hover:text-black"
                      }`}
                      aria-label={`Show ${opt.label} window`}
                      tabIndex={0}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {lastFetched ? (
                    <span className="text-xs text-gray-500">
                      Updated {formatRelativeTime(lastFetched)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400" />
                  )}

                  <button
                    onClick={() => loadMetrics(windowDays)}
                    disabled={isLoading}
                    className="h-10 px-5 border border-black text-[11px] font-bold tracking-widest uppercase text-gray-900 hover:bg-black hover:text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Refresh metrics"
                    tabIndex={0}
                  >
                    {isLoading ? "⟳ Refreshing..." : "⟳ Refresh"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════
            ERROR STATE
        ═══════════════════════════════════════════════════════════════ */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-7">
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={() => loadMetrics(windowDays)}
              className="h-10 px-5 border border-red-300 text-[11px] font-bold tracking-widest uppercase text-red-700 hover:bg-red-100 transition-colors"
              tabIndex={0}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            LOADING SKELETON
        ═══════════════════════════════════════════════════════════════ */}
        {isLoading && !data && (
          <div className="space-y-6">
            {/* KPI skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-2xl bg-gray-50 border border-gray-200 animate-pulse"
                />
              ))}
            </div>
            {/* Chart skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 rounded-2xl bg-gray-50 border border-gray-200 animate-pulse" />
              <div className="h-64 rounded-2xl bg-gray-50 border border-gray-200 animate-pulse" />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            DASHBOARD CONTENT
        ═══════════════════════════════════════════════════════════════ */}
        {data && (
          <div className="space-y-10">
            {/* Audit warnings (if any) */}
            <AuditWarnings warnings={auditWarnings} />

            {/* ── KPI Cards ── */}
            <section aria-label="Key Performance Indicators" className="space-y-4">
              <div>
                <h2 className={metricsSectionTitleClass} style={playfair}>
                  Key Performance Indicators
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {KPI_CARDS.map((card) => (
                  <KpiCard
                    key={card.key}
                    label={card.label}
                    value={data.kpi[card.key]}
                    total={data.totals[card.key]}
                    icon={card.icon}
                    color={card.color}
                    description={card.description}
                  />
                ))}
              </div>
            </section>

            {/* ── Funnel + Daily Chart (side by side on desktop) ── */}
            <section aria-label="Funnel and Trends">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FunnelChart stages={data.funnel} />
                <DailyChart data={data.daily} />
              </div>
            </section>

            {/* ── Conversion Cards ── */}
            <section aria-label="Conversion Rates">
              <h2
                className={`${metricsSectionTitleClass} mb-4`}
                style={playfair}
              >
                Conversion Rates
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {CONVERSION_CARDS.map((card) => (
                  <ConversionCard
                    key={card.key}
                    label={card.label}
                    value={data.conversions[card.key]}
                    fromLabel={card.fromLabel}
                    toLabel={card.toLabel}
                    color={card.color}
                  />
                ))}
              </div>
            </section>

            {/* ── Onboarding Step Distribution ── */}
            <section aria-label="Onboarding Distribution">
              <StepDistribution data={data.step_distribution} />
            </section>

            {/* ── Daily Appendix Table ── */}
            <section aria-label="Daily Data">
              <DailyTable data={data.daily} />
            </section>

            {/* ── Data Source Footer ── */}
            <footer className="rounded-2xl border border-gray-200/80 bg-gray-50 p-6 text-xs text-gray-600 space-y-2">
              <p className={metricsEyebrowClass}>Source Notes</p>
              <p>
                <strong className="text-gray-500">Primary source:</strong> Supabase —{" "}
                auth.users, public.users, onboarding_data, investor_profiles
              </p>
              <p>
                <strong className="text-gray-500">Query time:</strong>{" "}
                {data.audit.query_executed_at
                  ? new Date(data.audit.query_executed_at).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                <strong className="text-gray-500">Window:</strong>{" "}
                {windowDays === 0
                  ? "All time"
                  : `Last ${windowDays} days (${new Date(data.window.start).toLocaleDateString()} — ${new Date(data.window.end).toLocaleDateString()})`}
              </p>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsDashboard;
