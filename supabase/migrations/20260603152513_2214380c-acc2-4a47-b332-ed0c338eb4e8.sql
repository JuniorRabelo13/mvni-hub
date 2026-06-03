
-- ============================================================
-- 1) AI_* tables: admins/master_admin only; service_role bypasses
-- ============================================================
DROP POLICY IF EXISTS "Allow all for service role" ON public.ai_agent_settings;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.ai_agent_settings;

DO $$
DECLARE
  t TEXT;
  ai_tables TEXT[] := ARRAY[
    'ai_conversations','ai_messages','ai_memory','ai_context_embeddings',
    'ai_agent_settings','ai_prompt_templates','ai_token_usage',
    'ai_automation_logs','ai_lead_scores'
  ];
BEGIN
  FOREACH t IN ARRAY ai_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins manage %s" ON public.%I', t, t);
    EXECUTE format($p$CREATE POLICY "Admins manage %s" ON public.%I FOR ALL TO authenticated
      USING (public.has_role(auth.uid(),'admin'::app_role) OR public.is_master_admin(auth.uid()))
      WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.is_master_admin(auth.uid()))$p$, t, t);
  END LOOP;
END$$;

-- ============================================================
-- 2) import_heartbeats: enable RLS, admin-only read
-- ============================================================
ALTER TABLE public.import_heartbeats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read heartbeats" ON public.import_heartbeats;
CREATE POLICY "Admins read heartbeats" ON public.import_heartbeats FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.is_master_admin(auth.uid()));

-- ============================================================
-- 3) Tighten permissive USING true policies
-- ============================================================

-- queue_* and system_queues: deny all (service_role bypasses RLS)
DROP POLICY IF EXISTS "System access only" ON public.queue_dead_letters;
DROP POLICY IF EXISTS "System access only" ON public.queue_jobs;
DROP POLICY IF EXISTS "System access only" ON public.queue_metrics;
DROP POLICY IF EXISTS "System access only" ON public.queue_rate_limits;
DROP POLICY IF EXISTS "System access only" ON public.queue_workers;
DROP POLICY IF EXISTS "System access only" ON public.system_queues;

DO $$
DECLARE q TEXT;
BEGIN
  FOREACH q IN ARRAY ARRAY['queue_dead_letters','queue_jobs','queue_metrics','queue_rate_limits','queue_workers','system_queues'] LOOP
    EXECUTE format($p$CREATE POLICY "Admins read %s" ON public.%I FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(),'admin'::app_role) OR public.is_master_admin(auth.uid()))$p$, q, q);
  END LOOP;
END$$;

-- saas_plans
DROP POLICY IF EXISTS "Enable all access for master admins" ON public.saas_plans;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.saas_plans;
CREATE POLICY "Master admins manage plans" ON public.saas_plans FOR ALL TO authenticated
  USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Authenticated read plans" ON public.saas_plans FOR SELECT TO authenticated USING (true);

-- whatsapp_global_sends: drop overly permissive
DROP POLICY IF EXISTS "Authenticated read global sends" ON public.whatsapp_global_sends;
DROP POLICY IF EXISTS "service_role_insert_whatsapp_global_sends" ON public.whatsapp_global_sends;
DROP POLICY IF EXISTS "service_role_update_whatsapp_global_sends" ON public.whatsapp_global_sends;
CREATE POLICY "Admins read whatsapp_global_sends" ON public.whatsapp_global_sends FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.is_master_admin(auth.uid()));

-- whatsapp tables with "Admin can do everything" USING true
DROP POLICY IF EXISTS "Admin can do everything on whatsapp_instance_health" ON public.whatsapp_instance_health;
DROP POLICY IF EXISTS "Admin can do everything on whatsapp_instance_metrics" ON public.whatsapp_instance_metrics;
DROP POLICY IF EXISTS "Admin can do everything on whatsapp_instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Admin can do everything on whatsapp_message_logs" ON public.whatsapp_message_logs;
DROP POLICY IF EXISTS "Admin can do everything on whatsapp_message_queue" ON public.whatsapp_message_queue;
DROP POLICY IF EXISTS "Admin can do everything on whatsapp_reconnect_logs" ON public.whatsapp_reconnect_logs;

DO $$
DECLARE w TEXT;
BEGIN
  FOREACH w IN ARRAY ARRAY['whatsapp_instance_health','whatsapp_instance_metrics','whatsapp_instances','whatsapp_message_logs','whatsapp_message_queue','whatsapp_reconnect_logs'] LOOP
    EXECUTE format($p$CREATE POLICY "Admins manage %s" ON public.%I FOR ALL TO authenticated
      USING (public.has_role(auth.uid(),'admin'::app_role) OR public.is_master_admin(auth.uid()))
      WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.is_master_admin(auth.uid()))$p$, w, w);
  END LOOP;
END$$;

-- whatsapp_templates: restrict public SELECT to authenticated
DROP POLICY IF EXISTS "Templates visíveis por todos" ON public.whatsapp_templates;
CREATE POLICY "Authenticated read templates" ON public.whatsapp_templates FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 4) Add SET search_path = public to SECURITY DEFINER functions
-- ============================================================
ALTER FUNCTION public.claim_batch_import_chunks(integer) SET search_path = public;
ALTER FUNCTION public.detectar_ciclo_indicacao(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.fn_trigger_notify_status_change() SET search_path = public;
ALTER FUNCTION public.get_commission_ranking(integer) SET search_path = public;
ALTER FUNCTION public.get_master_affiliates_report() SET search_path = public;
ALTER FUNCTION public.get_master_audit_logs(uuid, text, timestamptz, timestamptz, integer) SET search_path = public;
ALTER FUNCTION public.get_master_lines_report() SET search_path = public;
ALTER FUNCTION public.get_master_workers_report() SET search_path = public;
ALTER FUNCTION public.handle_financial_telecom_sync() SET search_path = public;
ALTER FUNCTION public.increment_job_progress_batch(uuid, integer) SET search_path = public;
ALTER FUNCTION public.increment_lead_score(uuid, integer) SET search_path = public;
ALTER FUNCTION public.increment_whatsapp_metrics(uuid, boolean) SET search_path = public;
ALTER FUNCTION public.initialize_whatsapp_metrics() SET search_path = public;
ALTER FUNCTION public.registrar_fatura_idempotente(uuid, uuid, numeric, date) SET search_path = public;
ALTER FUNCTION public.update_import_heartbeat(uuid) SET search_path = public;
ALTER FUNCTION public.upsert_import_batch(jsonb[]) SET search_path = public;
