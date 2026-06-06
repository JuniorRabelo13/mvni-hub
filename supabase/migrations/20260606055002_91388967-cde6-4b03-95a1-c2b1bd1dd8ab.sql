ALTER FUNCTION public.calculate_next_run(integer) SET search_path = public;
ALTER FUNCTION public.complete_job(uuid) SET search_path = public;
ALTER FUNCTION public.fail_job(uuid, text) SET search_path = public;
ALTER FUNCTION public.fn_prevent_circular_referral() SET search_path = public;
ALTER FUNCTION public.fn_validar_saldo_saque() SET search_path = public;
ALTER FUNCTION public.get_global_finance_metrics() SET search_path = public;
ALTER FUNCTION public.get_master_critical_alerts() SET search_path = public;
ALTER FUNCTION public.get_master_gateways_report() SET search_path = public;
ALTER FUNCTION public.get_next_jobs(text, uuid, integer) SET search_path = public;
ALTER FUNCTION public.handle_worker_ping() SET search_path = public;
ALTER FUNCTION public.match_ai_context(vector, double precision, integer) SET search_path = public;
ALTER FUNCTION public.protect_pending_jobs() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_wallet_timestamp() SET search_path = public;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND d.objid IS NULL
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon, PUBLIC', r.proname, r.args);
  END LOOP;
END $$;