CREATE OR REPLACE FUNCTION public.prevent_usuarios_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  is_allowed boolean := false;
BEGIN
  current_user_id := auth.uid();

  -- Permite operações internas/service_role/bootstrap sem JWT
  IF current_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Bloqueia alteração de campos sensíveis por usuário comum
  IF
    (NEW.role IS DISTINCT FROM OLD.role)
    OR (NEW.status IS DISTINCT FROM OLD.status)
    OR (NEW.cadastro_pago_em IS DISTINCT FROM OLD.cadastro_pago_em)
  THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = current_user_id
        AND ur.role::text IN ('admin', 'master_admin')
    )
    OR EXISTS (
      SELECT 1
      FROM public.usuarios u
      WHERE u.id = current_user_id
        AND u.role::text IN ('admin', 'master_admin')
    )
    INTO is_allowed;

    IF NOT is_allowed THEN
      RAISE EXCEPTION 'Permission denied: apenas administradores podem alterar role/status/cadastro_pago_em';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
