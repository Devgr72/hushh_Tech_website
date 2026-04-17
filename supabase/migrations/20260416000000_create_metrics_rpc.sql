-- =============================================================================
-- Metrics Dashboard RPC Functions
-- Single-call, robust aggregation for the public KPI dashboard at /metrics
-- Uses SECURITY DEFINER to safely access auth.users counts without exposing PII
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. get_metrics_summary(window_days INT)
--    Returns all KPI counts, funnel, conversions, and step distribution
--    in a single database round-trip.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_metrics_summary(window_days INT DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  result JSONB;
  window_start TIMESTAMPTZ;
  now_ts TIMESTAMPTZ := now();

  -- KPI counts
  v_raw_signups BIGINT;
  v_persisted_users BIGINT;
  v_onboarding_started BIGINT;
  v_onboarding_completed BIGINT;
  v_profiles_created BIGINT;
  v_profiles_confirmed BIGINT;

  -- All-time counts (for context)
  v_total_signups BIGINT;
  v_total_persisted BIGINT;
  v_total_onboarding_started BIGINT;
  v_total_onboarding_completed BIGINT;
  v_total_profiles BIGINT;
  v_total_confirmed BIGINT;

  -- Step distribution
  v_step_distribution JSONB;

  -- Daily breakdown
  v_daily_breakdown JSONB;

  -- Audit
  v_data_freshness JSONB;
BEGIN
  -- Calculate window start (NULL = all time)
  IF window_days > 0 THEN
    window_start := now_ts - (window_days || ' days')::INTERVAL;
  ELSE
    window_start := '1970-01-01'::TIMESTAMPTZ;
  END IF;

  -- =========================================================================
  -- KPI Counts (windowed)
  -- =========================================================================
  SELECT count(*) INTO v_raw_signups
    FROM auth.users
    WHERE created_at >= window_start;

  SELECT count(*) INTO v_persisted_users
    FROM public.users
    WHERE created_at >= window_start;

  SELECT count(*) INTO v_onboarding_started
    FROM public.onboarding_data
    WHERE created_at >= window_start;

  SELECT count(*) INTO v_onboarding_completed
    FROM public.onboarding_data
    WHERE is_completed = true
      AND completed_at >= window_start;

  SELECT count(*) INTO v_profiles_created
    FROM public.investor_profiles
    WHERE created_at >= window_start;

  SELECT count(*) INTO v_profiles_confirmed
    FROM public.investor_profiles
    WHERE user_confirmed = true
      AND confirmed_at >= window_start;

  -- =========================================================================
  -- All-time totals
  -- =========================================================================
  SELECT count(*) INTO v_total_signups FROM auth.users;
  SELECT count(*) INTO v_total_persisted FROM public.users;
  SELECT count(*) INTO v_total_onboarding_started FROM public.onboarding_data;
  SELECT count(*) INTO v_total_onboarding_completed
    FROM public.onboarding_data WHERE is_completed = true;
  SELECT count(*) INTO v_total_profiles FROM public.investor_profiles;
  SELECT count(*) INTO v_total_confirmed
    FROM public.investor_profiles WHERE user_confirmed = true;

  -- =========================================================================
  -- Onboarding Step Distribution (all-time, shows where users are stuck)
  -- =========================================================================
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'step', step_num,
      'count', step_count,
      'is_completed', is_done
    ) ORDER BY step_num
  ), '[]'::JSONB)
  INTO v_step_distribution
  FROM (
    SELECT
      current_step AS step_num,
      count(*) AS step_count,
      is_completed AS is_done
    FROM public.onboarding_data
    GROUP BY current_step, is_completed
    ORDER BY current_step, is_completed
  ) sub;

  -- =========================================================================
  -- Daily Breakdown (last N days)
  -- =========================================================================
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'date', day::DATE,
      'signups', COALESCE(d_signups, 0),
      'persisted', COALESCE(d_persisted, 0),
      'onboarding_started', COALESCE(d_ob_started, 0),
      'onboarding_completed', COALESCE(d_ob_completed, 0),
      'profiles_created', COALESCE(d_profiles, 0),
      'profiles_confirmed', COALESCE(d_confirmed, 0)
    ) ORDER BY day
  ), '[]'::JSONB)
  INTO v_daily_breakdown
  FROM (
    SELECT
      gs.day,
      (SELECT count(*) FROM auth.users
         WHERE created_at::DATE = gs.day) AS d_signups,
      (SELECT count(*) FROM public.users
         WHERE created_at::DATE = gs.day) AS d_persisted,
      (SELECT count(*) FROM public.onboarding_data
         WHERE created_at::DATE = gs.day) AS d_ob_started,
      (SELECT count(*) FROM public.onboarding_data
         WHERE is_completed = true AND completed_at::DATE = gs.day) AS d_ob_completed,
      (SELECT count(*) FROM public.investor_profiles
         WHERE created_at::DATE = gs.day) AS d_profiles,
      (SELECT count(*) FROM public.investor_profiles
         WHERE user_confirmed = true AND confirmed_at::DATE = gs.day) AS d_confirmed
    FROM generate_series(
      window_start::DATE,
      now_ts::DATE,
      '1 day'::INTERVAL
    ) AS gs(day)
  ) daily;

  -- =========================================================================
  -- Data Freshness / Audit
  -- =========================================================================
  SELECT jsonb_build_object(
    'latest_signup', (SELECT max(created_at) FROM auth.users),
    'latest_persisted', (SELECT max(created_at) FROM public.users),
    'latest_onboarding', (SELECT max(created_at) FROM public.onboarding_data),
    'latest_profile', (SELECT max(created_at) FROM public.investor_profiles),
    'query_executed_at', now_ts
  ) INTO v_data_freshness;

  -- =========================================================================
  -- Build final result
  -- =========================================================================
  result := jsonb_build_object(
    'window', jsonb_build_object(
      'days', window_days,
      'start', window_start,
      'end', now_ts
    ),
    'kpi', jsonb_build_object(
      'raw_signups', v_raw_signups,
      'persisted_users', v_persisted_users,
      'onboarding_started', v_onboarding_started,
      'onboarding_completed', v_onboarding_completed,
      'profiles_created', v_profiles_created,
      'profiles_confirmed', v_profiles_confirmed
    ),
    'totals', jsonb_build_object(
      'raw_signups', v_total_signups,
      'persisted_users', v_total_persisted,
      'onboarding_started', v_total_onboarding_started,
      'onboarding_completed', v_total_onboarding_completed,
      'profiles_created', v_total_profiles,
      'profiles_confirmed', v_total_confirmed
    ),
    'conversions', jsonb_build_object(
      'signup_to_persisted', CASE WHEN v_raw_signups > 0
        THEN round((v_persisted_users::NUMERIC / v_raw_signups) * 100, 1) ELSE 0 END,
      'signup_to_onboarding', CASE WHEN v_raw_signups > 0
        THEN round((v_onboarding_started::NUMERIC / v_raw_signups) * 100, 1) ELSE 0 END,
      'onboarding_completion', CASE WHEN v_onboarding_started > 0
        THEN round((v_onboarding_completed::NUMERIC / v_onboarding_started) * 100, 1) ELSE 0 END,
      'profile_confirmation', CASE WHEN v_profiles_created > 0
        THEN round((v_profiles_confirmed::NUMERIC / v_profiles_created) * 100, 1) ELSE 0 END
    ),
    'funnel', jsonb_build_array(
      jsonb_build_object('stage', 'Raw Signups', 'count', v_raw_signups),
      jsonb_build_object('stage', 'Persisted Users', 'count', v_persisted_users),
      jsonb_build_object('stage', 'Onboarding Started', 'count', v_onboarding_started),
      jsonb_build_object('stage', 'Onboarding Completed', 'count', v_onboarding_completed),
      jsonb_build_object('stage', 'Profiles Created', 'count', v_profiles_created),
      jsonb_build_object('stage', 'Profiles Confirmed', 'count', v_profiles_confirmed)
    ),
    'step_distribution', v_step_distribution,
    'daily', v_daily_breakdown,
    'audit', v_data_freshness
  );

  RETURN result;
END;
$$;

-- Grant execute to service_role only (API calls use service_role key)
REVOKE ALL ON FUNCTION public.get_metrics_summary(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_metrics_summary(INT) FROM anon;
REVOKE ALL ON FUNCTION public.get_metrics_summary(INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_metrics_summary(INT) TO service_role;

COMMENT ON FUNCTION public.get_metrics_summary IS
  'Returns aggregated KPI metrics for the public dashboard. '
  'Uses SECURITY DEFINER to access auth.users safely. '
  'Only callable via service_role (API routes).';
