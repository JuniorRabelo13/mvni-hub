
-- ============================================
-- ENUMS
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.system_severity AS ENUM ('info','low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.system_status AS ENUM ('healthy','warning','critical','offline','degraded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.system_incident_status AS ENUM ('open','acknowledged','resolved','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  module TEXT NOT NULL,
  severity public.system_severity NOT NULL DEFAULT 'info',
  status public.system_status NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  message TEXT,
  fingerprint TEXT NOT NULL,
  occurrences INT NOT NULL DEFAULT 1,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_alerts_fp_open ON public.system_alerts (fingerprint) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_system_alerts_module ON public.system_alerts (module, severity, created_at DESC);

CREATE TABLE IF NOT EXISTS public.system_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  module TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity public.system_severity NOT NULL DEFAULT 'medium',
  status public.system_incident_status NOT NULL DEFAULT 'open',
  impact TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  recovery_time_seconds INT,
  auto_recovered BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_system_incidents_status ON public.system_incidents (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_incidents_module ON public.system_incidents (module, started_at DESC);

CREATE TABLE IF NOT EXISTS public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  service TEXT NOT NULL,
  status public.system_status NOT NULL,
  latency_ms INT,
  details JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_system_health_service ON public.system_health_checks (service, checked_at DESC);

CREATE TABLE IF NOT EXISTS public.system_metrics (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  module TEXT,
  dimensions JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON public.system_metrics (metric_name, created_at DESC);

CREATE TABLE IF NOT EXISTS public.system_uptime_logs (
  id BIGSERIAL PRIMARY KEY,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  module TEXT NOT NULL,
  status public.system_status NOT NULL,
  uptime_pct NUMERIC,
  downtime_seconds INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_system_uptime_module ON public.system_uptime_logs (module, checked_at DESC);

CREATE TABLE IF NOT EXISTS public.system_error_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  module TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  stacktrace TEXT,
  execution_time_ms INT,
  memory_usage_mb NUMERIC,
  cpu_estimate NUMERIC,
  retries INT DEFAULT 0,
  provider TEXT,
  provider_response JSONB,
  request_id TEXT,
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_system_errors_module_time ON public.system_error_logs (module, created_at DESC);

CREATE TABLE IF NOT EXISTS public.system_performance_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category TEXT NOT NULL,
  operation TEXT NOT NULL,
  duration_ms INT NOT NULL,
  module TEXT,
  is_slow BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_system_perf_slow ON public.system_performance_logs (is_slow, created_at DESC);

CREATE TABLE IF NOT EXISTS public.system_provider_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  status public.system_status NOT NULL DEFAULT 'healthy',
  last_check TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_success TIMESTAMPTZ,
  last_failure TIMESTAMPTZ,
  consecutive_failures INT DEFAULT 0,
  latency_ms INT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.system_resource_usage (
  id BIGSERIAL PRIMARY KEY,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  worker_id TEXT NOT NULL,
  module TEXT,
  cpu_pct NUMERIC,
  memory_mb NUMERIC,
  active_jobs INT,
  region TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_system_resource_worker ON public.system_resource_usage (worker_id, recorded_at DESC);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_uptime_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_provider_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_resource_usage ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'system_alerts','system_incidents','system_health_checks','system_metrics',
    'system_uptime_logs','system_error_logs','system_performance_logs',
    'system_provider_status','system_resource_usage'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "master_select_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "master_select_%s" ON public.%I FOR SELECT TO authenticated USING (public.is_master_admin(auth.uid()))', t, t);
  END LOOP;
END $$;

-- ============================================
-- ANTI-FLOOD: alert upsert
-- ============================================
CREATE OR REPLACE FUNCTION public.register_system_alert(
  p_module TEXT,
  p_severity public.system_severity,
  p_status public.system_status,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_fingerprint TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_fp TEXT := COALESCE(p_fingerprint, p_module || ':' || p_title);
  v_id UUID;
BEGIN
  INSERT INTO public.system_alerts (module, severity, status, title, message, fingerprint, metadata)
  VALUES (p_module, p_severity, p_status, p_title, p_message, v_fp, p_metadata)
  ON CONFLICT (fingerprint) WHERE resolved_at IS NULL
  DO UPDATE SET
    occurrences = system_alerts.occurrences + 1,
    last_seen = now(),
    updated_at = now(),
    severity = EXCLUDED.severity,
    status = EXCLUDED.status,
    metadata = EXCLUDED.metadata
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- ============================================
-- CLEANUP
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_observability_data()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.system_health_checks WHERE checked_at < now() - interval '7 days';
  DELETE FROM public.system_metrics WHERE created_at < now() - interval '30 days';
  DELETE FROM public.system_uptime_logs WHERE checked_at < now() - interval '30 days';
  DELETE FROM public.system_error_logs WHERE created_at < now() - interval '30 days';
  DELETE FROM public.system_performance_logs WHERE created_at < now() - interval '14 days';
  DELETE FROM public.system_resource_usage WHERE recorded_at < now() - interval '7 days';
  DELETE FROM public.system_incidents WHERE status IN ('resolved','closed') AND resolved_at < now() - interval '90 days';
  DELETE FROM public.system_alerts WHERE resolved_at IS NOT NULL AND resolved_at < now() - interval '30 days';
END $$;

-- ============================================
-- AUTO-RECOVERY: close alerts when service healthy
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_recover_alerts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Fecha alertas cujo serviço voltou a ficar healthy nas últimas checagens
  UPDATE public.system_alerts a
  SET resolved_at = now(), status = 'healthy', updated_at = now()
  WHERE a.resolved_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.system_health_checks h
      WHERE h.service = a.module
        AND h.status = 'healthy'
        AND h.checked_at > now() - interval '2 minutes'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.system_health_checks h2
      WHERE h2.service = a.module
        AND h2.status IN ('critical','offline','degraded')
        AND h2.checked_at > now() - interval '2 minutes'
    );

  -- Fecha incidentes correspondentes
  UPDATE public.system_incidents i
  SET status = 'resolved',
      resolved_at = now(),
      recovery_time_seconds = EXTRACT(EPOCH FROM (now() - i.started_at))::INT,
      auto_recovered = true,
      updated_at = now()
  WHERE i.status = 'open'
    AND NOT EXISTS (
      SELECT 1 FROM public.system_alerts a
      WHERE a.module = i.module AND a.resolved_at IS NULL
    );
END $$;

-- ============================================
-- OVERVIEW RPC
-- ============================================
CREATE OR REPLACE FUNCTION public.get_system_health_overview()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_master_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT jsonb_build_object(
    'generated_at', now(),
    'overall_status', (
      SELECT CASE
        WHEN COUNT(*) FILTER (WHERE severity = 'critical') > 0 THEN 'critical'
        WHEN COUNT(*) FILTER (WHERE severity = 'high') > 0 THEN 'warning'
        WHEN COUNT(*) > 0 THEN 'degraded'
        ELSE 'healthy'
      END
      FROM public.system_alerts WHERE resolved_at IS NULL
    ),
    'open_alerts', (SELECT COUNT(*) FROM public.system_alerts WHERE resolved_at IS NULL),
    'open_incidents', (SELECT COUNT(*) FROM public.system_incidents WHERE status = 'open'),
    'critical_alerts', (SELECT COUNT(*) FROM public.system_alerts WHERE resolved_at IS NULL AND severity = 'critical'),
    'errors_last_hour', (SELECT COUNT(*) FROM public.system_error_logs WHERE created_at > now() - interval '1 hour'),
    'slow_ops_last_hour', (SELECT COUNT(*) FROM public.system_performance_logs WHERE is_slow AND created_at > now() - interval '1 hour'),
    'providers', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'provider', provider, 'status', status, 'latency_ms', latency_ms,
        'consecutive_failures', consecutive_failures, 'last_check', last_check
      )), '[]'::jsonb)
      FROM public.system_provider_status
    ),
    'recent_alerts', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id, 'module', module, 'severity', severity, 'status', status,
        'title', title, 'message', message, 'occurrences', occurrences, 'last_seen', last_seen
      ) ORDER BY last_seen DESC), '[]'::jsonb)
      FROM (SELECT * FROM public.system_alerts WHERE resolved_at IS NULL ORDER BY last_seen DESC LIMIT 20) s
    ),
    'recent_incidents', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id, 'module', module, 'title', title, 'severity', severity,
        'status', status, 'started_at', started_at, 'resolved_at', resolved_at,
        'recovery_time_seconds', recovery_time_seconds
      ) ORDER BY started_at DESC), '[]'::jsonb)
      FROM (SELECT * FROM public.system_incidents ORDER BY started_at DESC LIMIT 20) i
    ),
    'modules_health', (
      SELECT COALESCE(jsonb_object_agg(service, jsonb_build_object(
        'status', status, 'latency_ms', latency_ms, 'checked_at', checked_at
      )), '{}'::jsonb)
      FROM (
        SELECT DISTINCT ON (service) service, status, latency_ms, checked_at
        FROM public.system_health_checks
        WHERE checked_at > now() - interval '5 minutes'
        ORDER BY service, checked_at DESC
      ) m
    )
  ) INTO v_result;

  RETURN v_result;
END $$;
