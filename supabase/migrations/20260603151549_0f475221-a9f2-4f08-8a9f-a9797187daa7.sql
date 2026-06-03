-- Trigger que bloqueia alteração de role/status em public.usuarios por quem não é admin/master_admin.
-- Mantém políticas existentes mas remove a vulnerabilidade de privilege escalation.
CREATE OR REPLACE FUNCTION public.prevent_usuarios_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permite operações de service_role (edge functions com SRK) e bootstrap (sem JWT)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Se role ou status mudou, exige admin/master_admin
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
         OR public.has_role(auth.uid(), 'master_admin'::app_role)) THEN
      RAISE EXCEPTION 'Permission denied: apenas administradores podem alterar role/status'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_usuarios_role_escalation ON public.usuarios;
CREATE TRIGGER tr_prevent_usuarios_role_escalation
BEFORE UPDATE ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.prevent_usuarios_role_escalation();

-- Defesa adicional: revoga UPDATE direto nas colunas sensíveis para roles do PostgREST.
REVOKE UPDATE (role, status) ON public.usuarios FROM anon, authenticated;