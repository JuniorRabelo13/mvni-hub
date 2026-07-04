
-- 1) dados_bancarios: add explicit WITH CHECK
DROP POLICY IF EXISTS "Users can manage their bank details" ON public.dados_bancarios;
CREATE POLICY "Users can manage their bank details"
ON public.dados_bancarios
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2) profiles: recreate update policy with explicit WITH CHECK (role-column protection is enforced by existing triggers prevent_profile_role_escalation_trg / trg_prevent_profiles_role_escalation / trg_profiles_block_role_escalation)
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3) usuarios: recreate update policy with explicit WITH CHECK (role-column protection is enforced by existing trigger tr_prevent_usuarios_role_escalation)
DROP POLICY IF EXISTS "Users can update their own record" ON public.usuarios;
CREATE POLICY "Users can update their own record"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4) Revoke EXECUTE from anon/public on trigger-only SECURITY DEFINER function
REVOKE EXECUTE ON FUNCTION public.prevent_profiles_role_escalation() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_escalation() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_usuarios_role_escalation() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.profiles_block_role_escalation() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_profile_role() FROM anon, PUBLIC;
