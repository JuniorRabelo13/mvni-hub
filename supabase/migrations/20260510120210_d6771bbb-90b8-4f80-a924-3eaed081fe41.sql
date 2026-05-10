-- 1. Remove redundant admin policy on security_logs that uses profiles.role
DROP POLICY IF EXISTS "Admins can read security logs" ON public.security_logs;

-- 2. Remove redundant admin policy on cobrancas that uses profiles.role
DROP POLICY IF EXISTS "Admins can view all cobrancas" ON public.cobrancas;

-- 3. Lock down whatsapp_global_sends writes to service_role only
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.whatsapp_global_sends;
DROP POLICY IF EXISTS "Authenticated users can update" ON public.whatsapp_global_sends;
DROP POLICY IF EXISTS "Authenticated can insert whatsapp_global_sends" ON public.whatsapp_global_sends;
DROP POLICY IF EXISTS "Authenticated can update whatsapp_global_sends" ON public.whatsapp_global_sends;
DROP POLICY IF EXISTS "whatsapp_global_sends_insert" ON public.whatsapp_global_sends;
DROP POLICY IF EXISTS "whatsapp_global_sends_update" ON public.whatsapp_global_sends;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'whatsapp_global_sends'
      AND cmd IN ('INSERT','UPDATE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.whatsapp_global_sends', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "service_role_insert_whatsapp_global_sends"
ON public.whatsapp_global_sends
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "service_role_update_whatsapp_global_sends"
ON public.whatsapp_global_sends
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Allow users to view their own import jobs
CREATE POLICY "Users can view their own import jobs"
ON public.import_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
