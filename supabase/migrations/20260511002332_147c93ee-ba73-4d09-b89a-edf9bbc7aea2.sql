-- Função SECURITY DEFINER para evitar recursão nas políticas
CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'master_admin'::app_role
  )
$$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename FROM pg_policies
    WHERE policyname = 'Master Owner access' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Master Owner access" ON %I.%I', r.schemaname, r.tablename);
    EXECUTE format(
      'CREATE POLICY "Master Owner access" ON %I.%I AS PERMISSIVE FOR ALL TO public USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()))',
      r.schemaname, r.tablename
    );
  END LOOP;
END$$;