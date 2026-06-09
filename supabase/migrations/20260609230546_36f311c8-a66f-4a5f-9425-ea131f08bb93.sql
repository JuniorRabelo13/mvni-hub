CREATE OR REPLACE FUNCTION public.prevent_usuarios_role_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Permite operações de service_role (edge functions com SRK) e bootstrap (sem JWT)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Se role, status ou cadastro_pago_em mudou, exige admin/master_admin
  IF (NEW.role IS DISTINCT FROM OLD.role)
     OR (NEW.status IS DISTINCT FROM OLD.status)
     OR (NEW.cadastro_pago_em IS DISTINCT FROM OLD.cadastro_pago_em) THEN
    IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
         OR public.has_role(auth.uid(), 'master_admin'::app_role)) THEN
      RAISE EXCEPTION 'Permission denied: apenas administradores podem alterar role/status/cadastro_pago_em'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;