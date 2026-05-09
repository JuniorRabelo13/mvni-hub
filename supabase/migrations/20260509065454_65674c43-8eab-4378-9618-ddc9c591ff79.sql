
-- 1. WhatsApp audit logs / metrics / alerts: lock to admins
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.whatsapp_audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.whatsapp_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.whatsapp_audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit logs" ON public.whatsapp_audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view metrics" ON public.whatsapp_metrics;
DROP POLICY IF EXISTS "Admins can insert metrics" ON public.whatsapp_metrics;
CREATE POLICY "Admins can view metrics" ON public.whatsapp_metrics
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert metrics" ON public.whatsapp_metrics
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view alerts" ON public.whatsapp_alerts;
DROP POLICY IF EXISTS "Admins can insert alerts" ON public.whatsapp_alerts;
CREATE POLICY "Admins can view alerts" ON public.whatsapp_alerts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert alerts" ON public.whatsapp_alerts
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. rpc_usage_logs: enable RLS, owner+admin read
ALTER TABLE public.rpc_usage_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own rpc usage" ON public.rpc_usage_logs;
DROP POLICY IF EXISTS "Admins view all rpc usage" ON public.rpc_usage_logs;
CREATE POLICY "Users view own rpc usage" ON public.rpc_usage_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 3. whatsapp_global_sends: require auth for read
DROP POLICY IF EXISTS "Public read for global sends" ON public.whatsapp_global_sends;
CREATE POLICY "Authenticated read global sends" ON public.whatsapp_global_sends
  FOR SELECT TO authenticated USING (true);

-- 4. profiles: prevent privilege escalation via self-update
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.gestor_id IS DISTINCT FROM OLD.gestor_id
     OR NEW.indicador_id IS DISTINCT FROM OLD.indicador_id THEN
    RAISE EXCEPTION 'Not allowed to modify role, gestor_id, or indicador_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- 5. cobrancas realtime: remove from broadcast publication to avoid leak
ALTER PUBLICATION supabase_realtime DROP TABLE public.cobrancas;
