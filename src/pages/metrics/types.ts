/**
 * TypeScript interfaces for the public KPI metrics dashboard.
 * All data sourced from Supabase via /api/metrics/summary.
 */

/* ── Window ── */
export interface MetricsWindow {
  days: number;
  start: string;
  end: string;
}

/* ── Core KPI counts ── */
export interface KpiCounts {
  raw_signups: number;
  persisted_users: number;
  onboarding_started: number;
  onboarding_completed: number;
  profiles_created: number;
  profiles_confirmed: number;
}

/* ── Conversion rates (percentages) ── */
export interface ConversionRates {
  signup_to_persisted: number;
  signup_to_onboarding: number;
  onboarding_completion: number;
  profile_confirmation: number;
}

/* ── Funnel stage ── */
export interface FunnelStage {
  stage: string;
  count: number;
}

/* ── Onboarding step distribution ── */
export interface StepDistributionEntry {
  step: number;
  count: number;
  is_completed: boolean;
}

/* ── Daily breakdown row ── */
export interface DailyRow {
  date: string;
  signups: number;
  persisted: number;
  onboarding_started: number;
  onboarding_completed: number;
  profiles_created: number;
  profiles_confirmed: number;
}

/* ── Audit / data freshness ── */
export interface AuditInfo {
  latest_signup: string | null;
  latest_persisted: string | null;
  latest_onboarding: string | null;
  latest_profile: string | null;
  query_executed_at: string;
}

/* ── Complete metrics response from RPC ── */
export interface MetricsSummary {
  window: MetricsWindow;
  kpi: KpiCounts;
  totals: KpiCounts;
  conversions: ConversionRates;
  funnel: FunnelStage[];
  step_distribution: StepDistributionEntry[];
  daily: DailyRow[];
  audit: AuditInfo;
}

/* ── API response wrapper ── */
export interface MetricsApiResponse {
  success: boolean;
  data: MetricsSummary;
  meta: {
    window_days: number;
    fetched_at: string;
    source: string;
  };
}

/* ── Dashboard state ── */
export type DashboardStatus = "loading" | "success" | "error" | "stale";

export interface DashboardState {
  status: DashboardStatus;
  data: MetricsSummary | null;
  error: string | null;
  lastFetched: string | null;
  windowDays: number;
}

/* ── KPI card display config ── */
export interface KpiCardConfig {
  label: string;
  key: keyof KpiCounts;
  icon: string;
  color: string;
  description: string;
}

/* ── Conversion card display config ── */
export interface ConversionCardConfig {
  label: string;
  key: keyof ConversionRates;
  fromLabel: string;
  toLabel: string;
  color: string;
}
