
-- 1) fingerprints_login: owner SELECT
CREATE POLICY "Users can view own fingerprints"
ON public.fingerprints_login
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2) indicacoes: user can read own referrals
CREATE POLICY "Users can view own referrals"
ON public.indicacoes
FOR SELECT
TO authenticated
USING (indicador_user_id = auth.uid() OR indicado_user_id = auth.uid());

-- 3) user_roles: prevent admin from writing master_admin rows
DROP POLICY IF EXISTS "roles_admin_write" ON public.user_roles;

CREATE POLICY "roles_admin_insert_non_master"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND role <> 'master_admin'::app_role);

CREATE POLICY "roles_admin_update_non_master"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND role <> 'master_admin'::app_role)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND role <> 'master_admin'::app_role);

CREATE POLICY "roles_admin_delete_non_master"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND role <> 'master_admin'::app_role);

-- 4) whatsapp_audit_logs: allow authenticated users to insert their own audit rows
CREATE POLICY "Users can insert own audit logs"
ON public.whatsapp_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
