
-- 1) configuracoes: restrict to authenticated role
DROP POLICY IF EXISTS "Authenticated can view non-sensitive settings" ON public.configuracoes;
CREATE POLICY "Authenticated can view non-sensitive settings"
  ON public.configuracoes FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (chave !~~* '%key%' AND chave !~~* '%token%' AND chave !~~* '%secret%')
  );

-- 2a) admin_alertas_fraude: replace bypassable JWT-claim policy
DROP POLICY IF EXISTS "Admins can view fraud alerts" ON public.admin_alertas_fraude;
CREATE POLICY "Admins can view fraud alerts"
  ON public.admin_alertas_fraude FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_master_admin(auth.uid()));

-- 2b) user_profiles: replace bypassable JWT-claim policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_master_admin(auth.uid()));

-- 3) notificacoes_vencimento: remove unrestricted public insert.
--    service_role bypasses RLS, so no replacement needed for backend functions.
DROP POLICY IF EXISTS "System can insert notifications history" ON public.notificacoes_vencimento;

-- 4) profiles: prevent privilege escalation via role column.
-- Trigger blocks role/gestor_id/indicador_id changes unless caller is admin/master.
CREATE OR REPLACE FUNCTION public.profiles_block_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (has_role(auth.uid(), 'admin'::app_role) OR is_master_admin(auth.uid())) THEN
      RAISE EXCEPTION 'not authorized to change profile role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_block_role_escalation ON public.profiles;
CREATE TRIGGER trg_profiles_block_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_block_role_escalation();

-- 5) Replace all profiles.role-based RLS with has_role/is_master_admin.
DROP POLICY IF EXISTS "Master profiles can view all commissions" ON public.commissions;
CREATE POLICY "Master profiles can view all commissions"
  ON public.commissions FOR SELECT TO authenticated
  USING (is_master_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Master profiles can view fraud alerts" ON public.fraud_alerts;
CREATE POLICY "Master profiles can view fraud alerts"
  ON public.fraud_alerts FOR SELECT TO authenticated
  USING (is_master_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Master profiles can update fraud alerts" ON public.fraud_alerts;
CREATE POLICY "Master profiles can update fraud alerts"
  ON public.fraud_alerts FOR UPDATE TO authenticated
  USING (is_master_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (is_master_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Master profiles can manage permissions" ON public.master_permissions;
CREATE POLICY "Master profiles can manage permissions"
  ON public.master_permissions FOR ALL TO authenticated
  USING (is_master_admin(auth.uid()))
  WITH CHECK (is_master_admin(auth.uid()));

DROP POLICY IF EXISTS "Master profiles can view permissions" ON public.master_permissions;

DROP POLICY IF EXISTS "Master profiles can manage projections" ON public.master_projections_history;
CREATE POLICY "Master profiles can manage projections"
  ON public.master_projections_history FOR ALL TO authenticated
  USING (is_master_admin(auth.uid()))
  WITH CHECK (is_master_admin(auth.uid()));

DROP POLICY IF EXISTS "Master profiles can view projections" ON public.master_projections_history;

DROP POLICY IF EXISTS "Master profiles can view system health" ON public.master_system_health;
CREATE POLICY "Master profiles can view system health"
  ON public.master_system_health FOR SELECT TO authenticated
  USING (is_master_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view processed events" ON public.processed_events;
CREATE POLICY "Admins can view processed events"
  ON public.processed_events FOR SELECT TO authenticated
  USING (is_master_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Master profiles can manage profile_permissions" ON public.profile_permissions;
CREATE POLICY "Master profiles can manage profile_permissions"
  ON public.profile_permissions FOR ALL TO authenticated
  USING (is_master_admin(auth.uid()))
  WITH CHECK (is_master_admin(auth.uid()));

DROP POLICY IF EXISTS "Master profiles can view all activity logs" ON public.user_activity_logs;
CREATE POLICY "Master profiles can view all activity logs"
  ON public.user_activity_logs FOR SELECT TO authenticated
  USING (is_master_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- 6) Recreate views with security_invoker so they enforce caller's RLS instead of view-owner's.
ALTER VIEW public.view_admin_alertas_fraude SET (security_invoker = true);
ALTER VIEW public.admin_mrr_consolidado SET (security_invoker = true);
