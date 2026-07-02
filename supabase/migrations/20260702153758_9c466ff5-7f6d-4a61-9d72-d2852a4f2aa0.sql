
-- 1. Prevent role/is_blocked/risk_score escalation on profiles via trigger
CREATE OR REPLACE FUNCTION public.prevent_profiles_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role and master_admin/admin to change protected fields
  IF current_setting('role', true) = 'service_role'
     OR public.has_role(auth.uid(), 'master_admin'::app_role)
     OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Not authorized to change role';
  END IF;
  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN
    RAISE EXCEPTION 'Not authorized to change is_blocked';
  END IF;
  IF NEW.risk_score IS DISTINCT FROM OLD.risk_score THEN
    RAISE EXCEPTION 'Not authorized to change risk_score';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profiles_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profiles_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profiles_role_escalation();

-- 2. Rewrite telecom_jobs & telecom_provider_logs policies to use has_role, not usuarios.role
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
           WHERE schemaname='public' AND tablename IN ('telecom_jobs','telecom_provider_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY "Master admins manage telecom_jobs"
ON public.telecom_jobs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'master_admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'master_admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access telecom_jobs"
ON public.telecom_jobs FOR ALL
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Master admins manage telecom_provider_logs"
ON public.telecom_provider_logs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'master_admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'master_admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access telecom_provider_logs"
ON public.telecom_provider_logs FOR ALL
TO service_role USING (true) WITH CHECK (true);
